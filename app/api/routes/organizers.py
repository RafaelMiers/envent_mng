from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError

from app.api.deps import DbSession
from app.api.routes.auth import get_current_organizer
from app.core.security import hash_password
from app.models.organizer import Organizer
from app.schemas.organizer import OrganizerCreate, OrganizerRead, OrganizerUpdate

router = APIRouter(prefix="/organizers", tags=["organizers"])
CurrentOrganizer = Annotated[Organizer, Depends(get_current_organizer)]


@router.post("", response_model=OrganizerRead, status_code=status.HTTP_201_CREATED)
def create_organizer(data: OrganizerCreate, db: DbSession):
    organizer_data = data.model_dump(exclude={"password"})
    organizer = Organizer(
        **organizer_data,
        password_hash=hash_password(data.password.get_secret_value()),
    )
    db.add(organizer)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        diagnostic = getattr(exc.orig, "diag", None)
        constraint = getattr(diagnostic, "constraint_name", None)
        if constraint == "uq_organizers_cnpj":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe uma organização cadastrada com este CNPJ.",
            ) from exc
        if constraint == "uq_organizers_email":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Este e-mail já está cadastrado.",
            ) from exc
        raise

    db.refresh(organizer)
    return organizer


@router.get("/me", response_model=OrganizerRead)
def read_organizer(organizer: CurrentOrganizer):
    return organizer


@router.put("/me", response_model=OrganizerRead)
def update_organizer(
    data: OrganizerUpdate,
    db: DbSession,
    organizer: CurrentOrganizer,
):
    update_data = data.model_dump(exclude_unset=True, exclude={"password"})
    for field, value in update_data.items():
        setattr(organizer, field, value)

    if "password" in data.model_fields_set:
        organizer.password_hash = hash_password(
            data.password.get_secret_value()
        )

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        diagnostic = getattr(exc.orig, "diag", None)
        constraint = getattr(diagnostic, "constraint_name", None)
        if constraint == "uq_organizers_cnpj":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe uma organização cadastrada com este CNPJ.",
            ) from exc
        if constraint == "uq_organizers_email":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Este e-mail já está cadastrado.",
            ) from exc
        raise

    db.refresh(organizer)
    return organizer
