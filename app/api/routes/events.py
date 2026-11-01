from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select

from app.api.deps import DbSession
from app.api.routes.auth import get_current_organizer
from app.models.event import Event
from app.models.organizer import Organizer
from app.schemas.event import EventCreate, EventRead, EventUpdate

router = APIRouter(prefix="/events", tags=["events"])
CurrentOrganizer = Annotated[Organizer, Depends(get_current_organizer)]


@router.post("", response_model=EventRead, status_code=status.HTTP_201_CREATED)
def create_event(
    data: EventCreate,
    db: DbSession,
    organizer: CurrentOrganizer,
):
    event = Event(**data.model_dump(), organizer_id=organizer.id)
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.get("", response_model=list[EventRead])
def list_events(db: DbSession, organizer: CurrentOrganizer):
    return db.scalars(
        select(Event)
        .where(Event.organizer_id == organizer.id)
        .order_by(Event.starts_at, Event.id)
    ).all()


def get_owned_event(event_id: int, organizer_id: int, db: DbSession) -> Event:
    event = db.scalar(
        select(Event).where(
            Event.id == event_id,
            Event.organizer_id == organizer_id,
        )
    )
    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evento não encontrado.",
        )
    return event


@router.get("/{event_id}", response_model=EventRead)
def read_event(
    event_id: int,
    db: DbSession,
    organizer: CurrentOrganizer,
):
    return get_owned_event(event_id, organizer.id, db)


@router.put("/{event_id}", response_model=EventRead)
def update_event(
    event_id: int,
    data: EventUpdate,
    db: DbSession,
    organizer: CurrentOrganizer,
):
    event = get_owned_event(event_id, organizer.id, db)
    for field, value in data.model_dump().items():
        setattr(event, field, value)
    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: int,
    db: DbSession,
    organizer: CurrentOrganizer,
) -> Response:
    event = get_owned_event(event_id, organizer.id, db)
    db.delete(event)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
