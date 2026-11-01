from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RegistrationCodeRequest(BaseModel):
    participant_id: int = Field(gt=0)


class RegistrationCodeVerify(BaseModel):
    participant_id: int = Field(gt=0)
    code: str = Field(pattern=r"^[0-9]{6}$")


class RegistrationAccessRead(BaseModel):
    registration_id: int
    ticket_access_token: str
    expires_at: datetime


class RegistrationMessageRead(BaseModel):
    id: int
    body: str
    created_at: datetime
    read_at: datetime


class RegistrationTicketRead(BaseModel):
    registration_id: int
    event_title: str
    event_location: str
    starts_at: datetime
    ends_at: datetime
    expires_at: datetime
    qr_payload: str | None
    qr_svg: str | None
    checked_in_at: datetime | None
    message: RegistrationMessageRead


class RegistrationOrganizerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    participant_id: int
    participant_name: str
    created_at: datetime
    checked_in_at: datetime | None


class CheckInCreate(BaseModel):
    ticket_token: str = Field(pattern=r"^[a-f0-9]{64}$")


class CheckInRead(BaseModel):
    registration_id: int
    participant_name: str
    checked_at: datetime
