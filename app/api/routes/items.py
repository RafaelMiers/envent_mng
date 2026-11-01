from fastapi import APIRouter
from sqlalchemy import select

from app.api.deps import DbSession
from app.models.item import Item
from app.schemas.item import ItemCreate, ItemRead

router = APIRouter(prefix="/items", tags=["items"])


@router.post("", response_model=ItemRead, status_code=201)
def create_item(data: ItemCreate, db: DbSession):
    item = Item(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("", response_model=list[ItemRead])
def list_items(db: DbSession):
    return db.scalars(select(Item)).all()