import smtplib
from email.message import EmailMessage

from app.core.config import settings


class EmailDeliveryNotConfigured(Exception):
    pass


class EmailDeliveryError(Exception):
    pass


def validate_email_configuration() -> None:
    if settings.smtp_host is None or settings.smtp_from_email is None:
        raise EmailDeliveryNotConfigured(
            "SMTP_HOST and SMTP_FROM_EMAIL must be configured."
        )

    if (settings.smtp_username is None) != (settings.smtp_password is None):
        raise EmailDeliveryNotConfigured(
            "SMTP_USERNAME and SMTP_PASSWORD must be configured together."
        )
    if settings.smtp_username is not None and not settings.smtp_starttls:
        raise EmailDeliveryNotConfigured(
            "SMTP_STARTTLS must be enabled when SMTP credentials are used."
        )


def send_registration_code(recipient: str, code: str) -> None:
    validate_email_configuration()
    username = settings.smtp_username
    password = (
        settings.smtp_password.get_secret_value()
        if settings.smtp_password is not None
        else None
    )

    message = EmailMessage()
    message["Subject"] = "Código para inscrição no EventCheck"
    message["From"] = str(settings.smtp_from_email)
    message["To"] = recipient
    message.set_content(
        f"Seu código de confirmação é {code}. "
        "Ele expira em 10 minutos. Se você não solicitou este código, ignore esta mensagem.",
        charset="utf-8",
    )

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
            smtp.ehlo()
            if settings.smtp_starttls:
                smtp.starttls()
                smtp.ehlo()
            if username is not None and password is not None:
                smtp.login(username, password)
            smtp.send_message(message)
    except (OSError, smtplib.SMTPException) as exc:
        raise EmailDeliveryError("Could not deliver the registration code.") from exc
