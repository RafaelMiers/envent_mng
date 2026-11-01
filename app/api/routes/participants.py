from fastapi import APIRouter, HTTPException
from sqlalchemy.exc import IntegrityError

from app.api.deps import DbSession
from app.models.participant import Participant
from app.schemas.participant import ParticipantCreate, ParticipantRead

router = APIRouter(prefix="/participants", tags=["participants"])


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
