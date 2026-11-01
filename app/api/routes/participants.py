from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.api.deps import DbSession
from app.api.routes.auth import get_current_organizer
from app.models.event import Event
from app.models.organizer import Organizer
from app.models.participant import Participant
from app.models.registration import Registration
from app.schemas.participant import (
    ParticipantCreate,
    ParticipantRead,
    ParticipantUpdate,
)

router = APIRouter(prefix="/participants", tags=["participants"])
CurrentOrganizer = Annotated[Organizer, Depends(get_current_organizer)]


@router.post("", response_model=ParticipantRead, status_code=201)
def create_participant(data: ParticipantCreate, db: DbSession):
    participant = Participant(**data.model_dump())
    db.add(participant)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        diagnostic = getattr(exc.orig, "diag", None)
        if getattr(diagnostic, "constraint_name", None) == "uq_participants_cpf":
            raise HTTPException(
                status_code=409,
                detail="Já existe um participante cadastrado com este CPF.",
            ) from exc
        raise

    db.refresh(participant)
    return participant


def get_owned_participant(
    participant_id: int,
    organizer_id: int,
    db: DbSession,
) -> Participant:
    participant = db.scalar(
        select(Participant)
        .join(Registration, Registration.participant_id == Participant.id)
        .join(Event, Event.id == Registration.event_id)
        .where(
            Participant.id == participant_id,
            Event.organizer_id == organizer_id,
        )
    )
    if participant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participante não encontrado.",
        )
    return participant


@router.get("", response_model=list[ParticipantRead])
def list_participants(db: DbSession, organizer: CurrentOrganizer):
    return db.scalars(
        select(Participant)
        .join(Registration, Registration.participant_id == Participant.id)
        .join(Event, Event.id == Registration.event_id)
        .where(Event.organizer_id == organizer.id)
        .distinct()
        .order_by(Participant.id)
    ).all()


@router.get("/{participant_id}", response_model=ParticipantRead)
def read_participant(
    participant_id: int,
    db: DbSession,
    organizer: CurrentOrganizer,
):
    return get_owned_participant(participant_id, organizer.id, db)


@router.put("/{participant_id}", response_model=ParticipantRead)
def update_participant(
    participant_id: int,
    data: ParticipantUpdate,
    db: DbSession,
    organizer: CurrentOrganizer,
):
    participant = get_owned_participant(participant_id, organizer.id, db)
    update_data = data.model_dump(exclude_unset=True)
    updated_email = update_data.get("email", participant.email)
    updated_phone = update_data.get("phone", participant.phone)
    if updated_email is None and updated_phone is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="O participante precisa manter um telefone ou e-mail de contato.",
        )

    for field, value in update_data.items():
        setattr(participant, field, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        diagnostic = getattr(exc.orig, "diag", None)
        if getattr(diagnostic, "constraint_name", None) == "uq_participants_cpf":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe um participante cadastrado com este CPF.",
            ) from exc
        raise

    db.refresh(participant)
    return participant


@router.delete("/{participant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_participant(
    participant_id: int,
    db: DbSession,
    organizer: CurrentOrganizer,
) -> Response:
    participant = get_owned_participant(participant_id, organizer.id, db)
    if db.scalar(
        select(Registration.id)
        .where(Registration.participant_id == participant.id)
        .limit(1)
    ) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Não é possível excluir um participante com inscrições. "
                "As inscrições e o histórico de check-in precisam ser preservados."
            ),
        )

    db.delete(participant)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
