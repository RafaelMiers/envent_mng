from datetime import datetime, timezone

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)


class EventData(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    location: str = Field(min_length=1, max_length=250)
    starts_at: datetime
    ends_at: datetime

    @field_validator("title", "location")
    @classmethod
    def strip_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Este campo não pode ficar vazio.")
        return value

    @model_validator(mode="after")
    def validate_event(self) -> "EventData":
        if self.starts_at.utcoffset() is None or self.ends_at.utcoffset() is None:
            raise ValueError("Datas e horários precisam incluir fuso horário.")
        if self.starts_at >= self.ends_at:
            raise ValueError("O início do evento deve ser anterior ao fim.")

        self.starts_at = self.starts_at.astimezone(timezone.utc)
        self.ends_at = self.ends_at.astimezone(timezone.utc)
        return self


class EventCreate(EventData):
    pass


class EventUpdate(EventData):
    pass


class EventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organizer_id: int
    title: str
    location: str
    starts_at: datetime
    ends_at: datetime
