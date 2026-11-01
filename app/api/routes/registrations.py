import hmac
import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.api.deps import DbSession
from app.api.routes.auth import get_current_organizer
from app.api.routes.events import get_owned_event
from app.core.email import (
    EmailDeliveryError,
    EmailDeliveryNotConfigured,
    send_registration_code,
    send_ticket_email,
    validate_email_configuration,
)
from app.core.qr import create_qr_svg
from app.core.security import (
    derive_ticket_token,
    hash_email_code,
    hash_secret_token,
)
from app.models.event import Event
from app.models.organizer import Organizer
from app.models.participant import Participant
from app.models.registration import (
    CheckIn,
    Registration,
    RegistrationEmailCode,
    RegistrationMessage,
)
from app.schemas.registration import (
    RegistrationAccessRead,
    RegistrationCodeRequest,
    RegistrationCodeVerify,
    RegistrationMessageRead,
    RegistrationOrganizerRead,
    RegistrationStartRead,
    RegistrationStartRequest,
    RegistrationTicketRead,
)

registration_router = APIRouter(
    prefix="/events/{event_id}/registrations",
    tags=["registrations"],
)
ticket_router = APIRouter(prefix="/registrations", tags=["registrations"])
CurrentOrganizer = Annotated[Organizer, Depends(get_current_organizer)]
ACCESS_WINDOW = timedelta(hours=1)
RESEND_COOLDOWN = timedelta(seconds=60)
CODE_LIFETIME = timedelta(minutes=10)
MAX_CODE_REQUESTS_PER_HOUR = 5
MAX_CODE_ATTEMPTS = 5
TICKET_GRACE_PERIOD = timedelta(hours=24)
logger = logging.getLogger(__name__)


@registration_router.post(
    "/start",
    response_model=RegistrationStartRead,
    status_code=status.HTTP_202_ACCEPTED,
)
def start_registration(
    event_id: int,
    data: RegistrationStartRequest,
    db: DbSession,
):
    now = datetime.now(timezone.utc)
    event = db.get(Event, event_id)
    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evento não encontrado.",
        )
    if event.starts_at <= now:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="As inscrições para este evento estão encerradas.",
        )

    participant = db.scalar(
        select(Participant).where(Participant.cpf == data.cpf)
    )
    if participant is None:
        participant = Participant(**data.model_dump())
        db.add(participant)
        try:
            db.flush()
        except IntegrityError as exc:
            db.rollback()
            participant = db.scalar(
                select(Participant).where(Participant.cpf == data.cpf)
            )
            if participant is None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Não foi possível iniciar a inscrição. Tente novamente.",
                ) from exc

    if participant.email is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não há e-mail cadastrado para enviar o código de confirmação.",
        )

    request_registration_code(
        event_id,
        RegistrationCodeRequest(participant_id=participant.id),
        db,
    )
    return RegistrationStartRead(participant_id=participant.id)


@registration_router.post(
    "/request-code",
    status_code=status.HTTP_202_ACCEPTED,
)
def request_registration_code(
    event_id: int,
    data: RegistrationCodeRequest,
    db: DbSession,
):
    now = datetime.now(timezone.utc)
    participant_and_event = db.execute(
        select(Participant, Event)
        .join(Event, Event.id == event_id)
        .where(
            Participant.id == data.participant_id,
            Participant.email.is_not(None),
        )
    ).first()
    if participant_and_event is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Não foi possível solicitar o código. Verifique se o evento "
                "e o participante existem e se há um e-mail cadastrado."
            ),
        )
    if participant_and_event.Event.starts_at <= now:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="As inscrições para este evento estão encerradas.",
        )

    try:
        validate_email_configuration()
    except EmailDeliveryNotConfigured as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="O envio de e-mail não está configurado.",
        ) from exc

    participant = participant_and_event.Participant
    challenge = db.scalar(
        select(RegistrationEmailCode)
        .where(
            RegistrationEmailCode.event_id == event_id,
            RegistrationEmailCode.participant_id == participant.id,
        )
        .with_for_update()
    )
    code = f"{secrets.randbelow(1_000_000):06d}"

    if challenge is None:
        challenge = RegistrationEmailCode(
            event_id=event_id,
            participant_id=participant.id,
            code_hash=hash_email_code(code, event_id, participant.id),
            expires_at=now + CODE_LIFETIME,
            attempts=0,
            request_count=1,
            window_started_at=now,
            last_sent_at=now,
        )
        db.add(challenge)
        try:
            db.flush()
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Aguarde antes de solicitar outro código.",
                headers={"Retry-After": str(RESEND_COOLDOWN.seconds)},
            ) from exc
    else:
        if now - challenge.last_sent_at < RESEND_COOLDOWN:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Aguarde antes de solicitar outro código.",
                headers={"Retry-After": str(RESEND_COOLDOWN.seconds)},
            )

        if now - challenge.window_started_at >= ACCESS_WINDOW:
            challenge.window_started_at = now
            challenge.request_count = 0
        if challenge.request_count >= MAX_CODE_REQUESTS_PER_HOUR:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Limite de códigos excedido. Tente novamente mais tarde.",
                headers={"Retry-After": str(int(ACCESS_WINDOW.total_seconds()))},
            )

        challenge.code_hash = hash_email_code(code, event_id, participant.id)
        challenge.expires_at = now + CODE_LIFETIME
        challenge.attempts = 0
        challenge.request_count += 1
        challenge.last_sent_at = now
        challenge.verified_at = None

    db.commit()
    try:
        send_registration_code(str(participant.email), code)
    except EmailDeliveryNotConfigured as exc:
        challenge.code_hash = ""
        challenge.expires_at = now
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="O envio de e-mail não está configurado.",
        ) from exc
    except EmailDeliveryError as exc:
        challenge.code_hash = ""
        challenge.expires_at = now
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Não foi possível enviar o código de confirmação.",
        ) from exc

    return {"detail": "Código de confirmação enviado ao e-mail cadastrado."}


@registration_router.post(
    "/verify-code",
    response_model=RegistrationAccessRead,
)
def verify_registration_code(
    event_id: int,
    data: RegistrationCodeVerify,
    db: DbSession,
):
    now = datetime.now(timezone.utc)
    challenge = db.scalar(
        select(RegistrationEmailCode)
        .where(
            RegistrationEmailCode.event_id == event_id,
            RegistrationEmailCode.participant_id == data.participant_id,
        )
        .with_for_update()
    )
    if (
        challenge is None
        or challenge.verified_at is not None
        or challenge.expires_at <= now
        or challenge.attempts >= MAX_CODE_ATTEMPTS
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Código inválido ou expirado.",
        )

    supplied_hash = hash_email_code(data.code, event_id, data.participant_id)
    if not hmac.compare_digest(supplied_hash, challenge.code_hash):
        challenge.attempts += 1
        if challenge.attempts >= MAX_CODE_ATTEMPTS:
            challenge.code_hash = ""
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Código inválido ou expirado.",
        )

    event = db.get(Event, event_id)
    participant = db.get(Participant, data.participant_id)
    if event is None or participant is None or event.starts_at <= now:
        challenge.code_hash = ""
        challenge.verified_at = now
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="As inscrições para este evento estão encerradas.",
        )

    challenge.code_hash = ""
    challenge.verified_at = now
    registration = db.scalar(
        select(Registration)
        .where(
            Registration.event_id == event_id,
            Registration.participant_id == participant.id,
        )
        .with_for_update()
    )
    if registration is None:
        registration = Registration(
            event_id=event_id,
            participant_id=participant.id,
            ticket_token_hash="",
            ticket_access_token_hash="",
            ticket_expires_at=event.ends_at + TICKET_GRACE_PERIOD,
        )
        db.add(registration)
        db.flush()
        db.add(
            RegistrationMessage(
                registration_id=registration.id,
                message_type="registration_confirmed",
                body=(
                    f"Inscrição confirmada para {event.title}. "
                    "Apresente o QR code na entrada do evento."
                ),
            )
        )

    access_token = secrets.token_urlsafe(32)
    ticket_token = derive_ticket_token(access_token)
    registration.ticket_access_token_hash = hash_secret_token(access_token)
    registration.ticket_token_hash = hash_secret_token(ticket_token)
    registration.ticket_expires_at = event.ends_at + TICKET_GRACE_PERIOD
    db.commit()

    ticket_email_sent = False
    if participant.email is not None:
        try:
            send_ticket_email(
                str(participant.email),
                participant.name,
                event.title,
                event.location,
                event.starts_at,
                ticket_token,
            )
            ticket_email_sent = True
        except (EmailDeliveryNotConfigured, EmailDeliveryError):
            logger.exception(
                "Could not send ticket email for registration_id=%s.",
                registration.id,
            )
    else:
        logger.warning(
            "Could not send ticket email for registration_id=%s.",
            registration.id,
        )

    return RegistrationAccessRead(
        registration_id=registration.id,
        ticket_access_token=access_token,
        expires_at=registration.ticket_expires_at,
        ticket_email_sent=ticket_email_sent,
    )


@ticket_router.get("/{registration_id}/ticket", response_model=RegistrationTicketRead)
def read_registration_ticket(
    registration_id: int,
    db: DbSession,
    access_token: Annotated[str, Header(alias="X-Ticket-Access-Token")],
):
    now = datetime.now(timezone.utc)
    registration_data = db.execute(
        select(Registration, Event)
        .join(Event, Event.id == Registration.event_id)
        .where(Registration.id == registration_id)
    ).first()
    if registration_data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ingresso não encontrado.",
        )

    registration, event = registration_data
    supplied_hash = hash_secret_token(access_token)
    if (
        not hmac.compare_digest(
            supplied_hash,
            registration.ticket_access_token_hash,
        )
        or registration.ticket_expires_at <= now
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ingresso não encontrado ou expirado.",
        )

    message = db.scalar(
        select(RegistrationMessage).where(
            RegistrationMessage.registration_id == registration.id,
            RegistrationMessage.message_type == "registration_confirmed",
        )
    )
    if message is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Mensagem de confirmação não encontrada.",
        )

    checkin = db.scalar(
        select(CheckIn).where(CheckIn.registration_id == registration.id)
    )
    ticket_token = derive_ticket_token(access_token)
    if not hmac.compare_digest(
        hash_secret_token(ticket_token),
        registration.ticket_token_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="O ingresso não está mais ativo.",
        )

    if message.read_at is None:
        message.read_at = now
        db.commit()

    return RegistrationTicketRead(
        registration_id=registration.id,
        event_title=event.title,
        event_location=event.location,
        starts_at=event.starts_at,
        ends_at=event.ends_at,
        expires_at=registration.ticket_expires_at,
        qr_payload=None if checkin is not None else ticket_token,
        qr_svg=None if checkin is not None else create_qr_svg(ticket_token),
        checked_in_at=checkin.checked_at if checkin is not None else None,
        message=RegistrationMessageRead(
            id=message.id,
            body=message.body,
            created_at=message.created_at,
            read_at=message.read_at or now,
        ),
    )


@registration_router.get("", response_model=list[RegistrationOrganizerRead])
def list_event_registrations(
    event_id: int,
    db: DbSession,
    organizer: CurrentOrganizer,
):
    get_owned_event(event_id, organizer.id, db)
    registrations = db.execute(
        select(
            Registration,
            Participant.name,
            Participant.age,
            Participant.email,
            Participant.phone,
            CheckIn.checked_at,
        )
        .join(Participant, Participant.id == Registration.participant_id)
        .outerjoin(CheckIn, CheckIn.registration_id == Registration.id)
        .where(Registration.event_id == event_id)
        .order_by(Registration.created_at, Registration.id)
    ).all()
    return [
        RegistrationOrganizerRead(
            id=registration.id,
            participant_id=registration.participant_id,
            participant_name=participant_name,
            participant_age=participant_age,
            participant_email=participant_email,
            participant_phone=participant_phone,
            created_at=registration.created_at,
            checked_in_at=checked_in_at,
        )
        for (
            registration,
            participant_name,
            participant_age,
            participant_email,
            participant_phone,
            checked_in_at,
        ) in registrations
    ]
