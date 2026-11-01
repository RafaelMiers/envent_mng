from fastapi import APIRouter

from app.api.routes import (
    auth,
    checkins,
    events,
    items,
    organizers,
    participants,
    registrations,
)

api_router = APIRouter()
api_router.include_router(items.router)
api_router.include_router(participants.router)
api_router.include_router(organizers.router)
api_router.include_router(auth.router)
api_router.include_router(events.router)
api_router.include_router(registrations.registration_router)
api_router.include_router(registrations.ticket_router)
api_router.include_router(checkins.router)