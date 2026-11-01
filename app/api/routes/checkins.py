from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.api.deps import DbSession
from app.api.routes.auth import get_current_organizer
from app.core.security import hash_secret_token
from app.models.event import Event
from app.models.organizer import Organizer
from app.models.participant import Participant
from app.models.registration import CheckIn, Registration
from app.schemas.registration import CheckInCreate, CheckInRead

router = APIRouter(
    prefix="/events/{event_id}/checkins",
    tags=["check-ins"],
)
CurrentOrganizer = Annotated[Organizer, Depends(get_current_organizer)]
TICKET_GRACE_PERIOD = timedelta(hours=24)


@router.post("", response_model=CheckInRead, status_code=status.HTTP_201_CREATED)
def create_checkin(
    event_id: int,
    data: CheckInCreate,
    db: DbSession,
    organizer: CurrentOrganizer,
):
    registration_data = db.execute(
        select(Registration, Event, Participant.name)
        .join(Event, Event.id == Registration.event_id)
        .join(Participant, Participant.id == Registration.participant_id)
        .where(
            Event.id == event_id,
            Event.organizer_id == organizer.id,
            Registration.ticket_token_hash == hash_secret_token(data.ticket_token),
        )
        .with_for_update()
    ).first()
    if registration_data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ingresso inválido para este evento.",
        )

    registration, event, participant_name = registration_data
    now = datetime.now(timezone.utc)
    if now < event.starts_at:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="O check-in ainda não está aberto.",
        )
    if now >= event.ends_at + TICKET_GRACE_PERIOD:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="O prazo para check-in deste evento expirou.",
        )

    existing_checkin = db.scalar(
        select(CheckIn).where(CheckIn.registration_id == registration.id)
    )
    if existing_checkin is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este ingresso já foi utilizado para check-in.",
        )

    checkin = CheckIn(
        registration_id=registration.id,
        organizer_id=organizer.id,
        checked_at=now,
    )
    db.add(checkin)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        diagnostic = getattr(exc.orig, "diag", None)
        if (
            getattr(diagnostic, "constraint_name", None)
            == "uq_checkins_registration"
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Este ingresso já foi utilizado para check-in.",
            ) from exc
        raise

    return CheckInRead(
        registration_id=registration.id,
        participant_name=participant_name,
        checked_at=checkin.checked_at,
    )
