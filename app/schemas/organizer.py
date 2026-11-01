import re

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    SecretStr,
    field_validator,
    model_validator,
)


class OrganizerCreate(BaseModel):
    organization_name: str = Field(min_length=1, max_length=150)
    cnpj: str
    email: EmailStr
    phone: str | None = Field(default=None, max_length=20)
    password: SecretStr = Field(min_length=8, max_length=128)

    @field_validator("organization_name")
    @classmethod
    def strip_organization_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Nome da organização não pode ficar vazio.")
        return value

    @field_validator("cnpj")
    @classmethod
    def validate_cnpj(cls, value: str) -> str:
        if not re.fullmatch(r"[A-Za-z0-9./\-\s]+", value):
            raise ValueError("CNPJ contém caracteres inválidos.")

        cnpj = re.sub(r"[^A-Za-z0-9]", "", value).upper()
        if (
            len(cnpj) != 14
            or not cnpj[-2:].isdigit()
            or len(set(cnpj)) == 1
        ):
            raise ValueError("CNPJ inválido.")

        weights = (6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2)
        for length in (12, 13):
            total = sum(
                (ord(character) - 48) * weights[index + 13 - length]
                for index, character in enumerate(cnpj[:length])
            )
            remainder = total % 11
            check_digit = 0 if remainder < 2 else 11 - remainder
            if check_digit != int(cnpj[length]):
                raise ValueError("CNPJ inválido.")

        return cnpj

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()

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


class OrganizerLogin(BaseModel):
    email: EmailStr
    password: SecretStr

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()


class OrganizerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_name: str
    cnpj: str
    email: EmailStr
    phone: str | None


class OrganizerUpdate(BaseModel):
    organization_name: str | None = Field(default=None, min_length=1, max_length=150)
    cnpj: str | None = None
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=20)
    password: SecretStr | None = Field(default=None, min_length=8, max_length=128)

    @field_validator("organization_name")
    @classmethod
    def strip_organization_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("Nome da organização não pode ficar vazio.")
        return value

    @field_validator("cnpj")
    @classmethod
    def validate_cnpj(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return OrganizerCreate.validate_cnpj(value)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr | None) -> str | None:
        if value is None:
            return None
        return str(value).strip().lower()

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        return OrganizerCreate.validate_phone(value)

    @model_validator(mode="after")
    def validate_update(self) -> "OrganizerUpdate":
        if not self.model_fields_set:
            raise ValueError("Informe ao menos um campo para atualizar.")
        for field in ("organization_name", "cnpj", "email", "password"):
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"{field} não pode ser nulo.")
        return self


class TokenRead(BaseModel):
    access_token: str
    token_type: str = "bearer"
