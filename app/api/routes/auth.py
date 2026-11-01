from typing import Annotated

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select

from app.api.deps import DbSession
from app.core.security import create_access_token, decode_access_token, verify_password
from app.models.organizer import Organizer
from app.schemas.organizer import OrganizerLogin, OrganizerRead, TokenRead

router = APIRouter(prefix="/auth", tags=["authentication"])
bearer_scheme = HTTPBearer()


@router.post("/login", response_model=TokenRead)
def login(data: OrganizerLogin, db: DbSession):
    organizer = db.scalar(
        select(Organizer).where(Organizer.email == str(data.email))
    )
    if organizer is None or not verify_password(
        data.password.get_secret_value(), organizer.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha inválidos.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return TokenRead(access_token=create_access_token(organizer.id))


def get_current_organizer(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    db: DbSession,
) -> Organizer:
    try:
        subject = decode_access_token(credentials.credentials)
        organizer_id = int(subject)
    except (jwt.InvalidTokenError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    organizer = db.get(Organizer, organizer_id)
    if organizer is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Organizador não encontrado.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return organizer


@router.get("/me", response_model=OrganizerRead)
def read_current_organizer(
    organizer: Annotated[Organizer, Depends(get_current_organizer)],
):
    return organizer
