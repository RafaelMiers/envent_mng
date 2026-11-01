from pydantic import EmailStr, Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    jwt_secret_key: SecretStr = Field(min_length=32)
    smtp_host: str | None = None
    smtp_port: int = Field(default=587, ge=1, le=65535)
    smtp_username: str | None = None
    smtp_password: SecretStr | None = None
    smtp_from_email: EmailStr | None = None
    smtp_starttls: bool = True

    @field_validator(
        "smtp_host",
        "smtp_username",
        "smtp_password",
        "smtp_from_email",
        mode="before",
    )
    @classmethod
    def empty_smtp_values_are_unset(cls, value: object) -> object:
        return None if value == "" else value

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()