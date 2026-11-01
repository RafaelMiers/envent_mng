from datetime import datetime
from email.message import EmailMessage
from html import escape
import smtplib

from app.core.config import settings
from app.core.ticket import create_ticket_pdf, format_event_start


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

    message = EmailMessage()
    message["Subject"] = "Código para inscrição no EventCheck"
    message["From"] = str(settings.smtp_from_email)
    message["To"] = recipient
    message.set_content(
        f"Seu código de confirmação é {code}. "
        "Ele expira em 10 minutos. Se você não solicitou este código, ignore esta mensagem.",
        charset="utf-8",
    )
    _deliver_message(message)


def send_ticket_email(
    recipient: str,
    participant_name: str,
    event_title: str,
    event_location: str,
    starts_at: datetime,
    ticket_token: str,
) -> None:
    validate_email_configuration()

    formatted_start = format_event_start(starts_at)
    safe_participant_name = escape(participant_name)
    safe_event_title = escape(event_title)
    safe_event_location = escape(event_location)

    message = EmailMessage()
    message["Subject"] = (
        f"Seu ingresso para {' '.join(event_title.split())} | EventCheck"
    )
    message["From"] = str(settings.smtp_from_email)
    message["To"] = recipient
    message.set_content(
        (
            f"Olá, {participant_name}!\n\n"
            "Sua inscrição foi confirmada.\n\n"
            f"Evento: {event_title}\n"
            f"Local: {event_location}\n"
            f"Data e horário: {formatted_start}\n\n"
            "O ingresso completo está anexado neste e-mail em PDF. "
            "Apresente o QR code do ingresso na entrada do evento."
        ),
        charset="utf-8",
    )
    message.add_alternative(
        f"""\
        <html>
          <body style="font-family: Arial, sans-serif; color: #1f1630;">
            <h2>Inscrição confirmada</h2>
            <p>Olá, {safe_participant_name}!</p>
            <p>O ingresso completo para <strong>{safe_event_title}</strong> está anexado a este e-mail em PDF.</p>
            <p><strong>Local:</strong> {safe_event_location}<br>
            <strong>Data e horário:</strong> {formatted_start}</p>
            <p>Apresente o QR code do ingresso na entrada do evento.</p>
          </body>
        </html>
        """,
        subtype="html",
        charset="utf-8",
    )
    ticket_pdf = create_ticket_pdf(
        participant_name,
        event_title,
        event_location,
        starts_at,
        ticket_token,
    )
    message.add_attachment(
        ticket_pdf,
        maintype="application",
        subtype="pdf",
        filename="ingresso-eventcheck.pdf",
    )
    _deliver_message(message)


def _deliver_message(message: EmailMessage) -> None:
    username = settings.smtp_username
    password = (
        settings.smtp_password.get_secret_value()
        if settings.smtp_password is not None
        else None
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
        raise EmailDeliveryError("Could not deliver the email.") from exc
