from fastapi import APIRouter

from app.api.routes import items, participants

api_router = APIRouter()
api_router.include_router(items.router)
api_router.include_router(participants.router)