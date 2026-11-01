from sqlalchemy import String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Organizer(Base):
    __tablename__ = "organizers"
    __table_args__ = (
        UniqueConstraint("cnpj", name="uq_organizers_cnpj"),
        UniqueConstraint("email", name="uq_organizers_email"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    organization_name: Mapped[str] = mapped_column(String(150))
    cnpj: Mapped[str] = mapped_column(String(14))
    email: Mapped[str] = mapped_column(String(254))
    phone: Mapped[str | None] = mapped_column(String(20), default=None)
    password_hash: Mapped[str] = mapped_column(String(255))
