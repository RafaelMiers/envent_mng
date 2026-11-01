from fastapi import FastAPI

import app.models  # noqa: F401  (registra as tabelas)
from app.api.router import api_router
from app.db.base import Base
from app.db.session import engine

app = FastAPI(title="QR Code API")

app.include_router(api_router)