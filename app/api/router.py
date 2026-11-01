from fastapi import APIRouter

from app.api.routes import auth, events, items, organizers, participants

api_router = APIRouter()
api_router.include_router(items.router)
api_router.include_router(participants.router)
api_router.include_router(organizers.router)
api_router.include_router(auth.router)
api_router.include_router(events.router)