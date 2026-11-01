import re

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
    model_validator,
)


class ParticipantCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    cpf: str
    age: int = Field(ge=0, le=120)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=20)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Nome não pode ficar vazio.")
        return value

    @field_validator("cpf")
    @classmethod
    def validate_cpf(cls, value: str) -> str:
        if not re.fullmatch(r"[0-9.\-\s]+", value):
            raise ValueError("CPF deve conter apenas números, pontos e hífen.")

        digits = re.sub(r"\D", "", value)
        if len(digits) != 11:
            raise ValueError("CPF inválido.")

        return digits

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        if value is None:
            return None

        value = value.strip()
        if not re.fullmatch(r"\+?[0-9(). -]+", value):
            raise ValueError("Telefone inválido.")
        digit_count = sum(character.isdigit() for character in value)
        if not 7 <= digit_count <= 15:
            raise ValueError("Telefone deve conter de 7 a 15 dígitos.")
        return value

    @model_validator(mode="after")
    def require_contact(self) -> "ParticipantCreate":
        if self.email is None and self.phone is None:
            raise ValueError("Informe um telefone ou e-mail para contato.")
        return self


class ParticipantRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    age: int
    email: EmailStr | None
    phone: str | None


class ParticipantUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    cpf: str | None = None
    age: int | None = Field(default=None, ge=0, le=120)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=20)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("Nome não pode ficar vazio.")
        return value

    @field_validator("cpf")
    @classmethod
    def validate_cpf(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return ParticipantCreate.validate_cpf(value)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        return ParticipantCreate.validate_phone(value)

    @model_validator(mode="after")
    def validate_update(self) -> "ParticipantUpdate":
        if not self.model_fields_set:
            raise ValueError("Informe ao menos um campo para atualizar.")
        for field in ("name", "cpf", "age"):
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"{field} não pode ser nulo.")
        return self
