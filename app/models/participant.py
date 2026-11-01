from sqlalchemy import CheckConstraint, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Participant(Base):
    __tablename__ = "participants"
    __table_args__ = (
        UniqueConstraint("cpf", name="uq_participants_cpf"),
        CheckConstraint(
            "email IS NOT NULL OR phone IS NOT NULL",
            name="ck_participants_contact_required",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150))
    cpf: Mapped[str] = mapped_column(String(11))
    age: Mapped[int]
    email: Mapped[str | None] = mapped_column(String(254), default=None)
    phone: Mapped[str | None] = mapped_column(String(20), default=None)
