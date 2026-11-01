from datetime import datetime
from io import BytesIO
from pathlib import Path
from zoneinfo import ZoneInfo

import qrcode
import reportlab
from reportlab.lib.colors import HexColor, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


_FONT_NAME = "EventCheck"
_FONT_REGISTERED = False
_EVENT_TIMEZONE = ZoneInfo("America/Sao_Paulo")


def format_event_start(starts_at: datetime) -> str:
    local_start = starts_at.astimezone(_EVENT_TIMEZONE)
    utc_offset = local_start.strftime("%z")
    formatted_offset = f"{utc_offset[:3]}:{utc_offset[3:]}"
    return (
        f"{local_start.strftime('%d/%m/%Y às %H:%M')} "
        f"(horário de Brasília, UTC{formatted_offset})"
    )


def create_ticket_pdf(
    participant_name: str,
    event_title: str,
    event_location: str,
    starts_at: datetime,
    ticket_token: str,
) -> bytes:
    _register_font()
    card_width = 436
    card_x = 12
    card_y = 12
    header_height = 44
    qr_size = 108
    qr_gap = 10
    qr_caption_height = 14
    body_top_gap = 10
    body_bottom_gap = 10
    text_x = card_x + 16
    text_width = card_width - 32 - qr_size - qr_gap
    label_size = 6.5
    label_height = 11
    value_line_height = 11
    field_gap = 4

    fields = (
        ("PARTICIPANTE", participant_name, 9.5),
        ("EVENTO", event_title, 10),
        ("LOCAL", event_location, 9),
        ("DATA E HORÁRIO", format_event_start(starts_at), 8.5),
    )
    wrapped_fields = [
        (
            label,
            _wrap_text(value, _FONT_NAME, font_size, text_width),
            font_size,
        )
        for label, value, font_size in fields
    ]
    details_height = sum(
        label_height + len(lines) * value_line_height + field_gap
        for _, lines, _ in wrapped_fields
    )
    qr_content_height = qr_size + qr_caption_height
    body_height = max(details_height, qr_content_height)
    card_height = (
        header_height + body_top_gap + body_height + body_bottom_gap
    )
    page_width = card_width + card_x * 2
    page_height = card_height + card_y * 2
    card_top = card_y + card_height
    header_y = card_top - header_height

    output = BytesIO()
    pdf = canvas.Canvas(output, pagesize=(page_width, page_height))
    background = HexColor("#17121F")
    card_color = HexColor("#241B30")
    header_color = HexColor("#30223F")
    ink = HexColor("#F8F5FC")
    muted = HexColor("#C4B8D5")
    accent = HexColor("#B99AE8")

    pdf.setFillColor(background)
    pdf.rect(0, 0, page_width, page_height, fill=1, stroke=0)
    pdf.setFillColor(card_color)
    pdf.roundRect(card_x, card_y, card_width, card_height, 10, fill=1, stroke=0)
    pdf.setFillColor(header_color)
    pdf.roundRect(card_x, header_y, card_width, header_height, 10, fill=1, stroke=0)
    pdf.rect(card_x, header_y, card_width, 10, fill=1, stroke=0)

    pdf.setFillColor(ink)
    pdf.setFont(_FONT_NAME, 14)
    pdf.drawString(card_x + 16, card_top - 27, "EventCheck")
    pdf.setFillColor(accent)
    pdf.setFont(_FONT_NAME, 8)
    pdf.drawRightString(
        card_x + card_width - 16,
        card_top - 25,
        "INGRESSO CONFIRMADO",
    )

    y = header_y - body_top_gap
    for label, lines, font_size in wrapped_fields:
        pdf.setFillColor(accent)
        pdf.setFont(_FONT_NAME, label_size)
        pdf.drawString(text_x, y, label)
        y -= label_height
        pdf.setFillColor(ink)
        pdf.setFont(_FONT_NAME, font_size)
        for line in lines:
            pdf.drawString(text_x, y, line)
            y -= value_line_height
        y -= field_gap

    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        border=4,
    )
    qr.add_data(ticket_token)
    qr.make(fit=True)
    qr_matrix = qr.get_matrix()

    module_size = qr_size / len(qr_matrix)
    qr_x = card_x + card_width - 16 - qr_size
    body_bottom = card_y + body_bottom_gap
    qr_y = body_bottom + (body_height - qr_content_height) / 2 + qr_caption_height

    pdf.setFillColor(white)
    pdf.roundRect(
        qr_x - 5,
        qr_y - 5,
        qr_size + 10,
        qr_size + 10,
        5,
        fill=1,
        stroke=0,
    )
    pdf.setFillColor(HexColor("#21172E"))
    for row_index, row in enumerate(qr_matrix):
        for column_index, is_filled in enumerate(row):
            if is_filled:
                pdf.rect(
                    qr_x + column_index * module_size,
                    qr_y + (len(qr_matrix) - row_index - 1) * module_size,
                    module_size,
                    module_size,
                    fill=1,
                    stroke=0,
                )

    pdf.setFillColor(muted)
    pdf.setFont(_FONT_NAME, 6.5)
    pdf.drawCentredString(
        qr_x + qr_size / 2,
        qr_y - 11,
        "Apresente na entrada do evento",
    )
    pdf.showPage()
    pdf.save()
    return output.getvalue()


def _register_font() -> None:
    global _FONT_REGISTERED
    if _FONT_REGISTERED:
        return

    font_path = Path(reportlab.__file__).parent / "fonts" / "Vera.ttf"
    pdfmetrics.registerFont(TTFont(_FONT_NAME, str(font_path)))
    _FONT_REGISTERED = True


def _wrap_text(
    text: str,
    font_name: str,
    font_size: float,
    max_width: float,
) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current_line = ""

    for word in words:
        candidate = f"{current_line} {word}".strip()
        if stringWidth(candidate, font_name, font_size) <= max_width:
            current_line = candidate
            continue

        if current_line:
            lines.append(current_line)
            current_line = ""

        while stringWidth(word, font_name, font_size) > max_width:
            split_index = 1
            while (
                split_index < len(word)
                and stringWidth(word[: split_index + 1], font_name, font_size)
                <= max_width
            ):
                split_index += 1
            lines.append(word[:split_index])
            word = word[split_index:]
        current_line = word

    if current_line:
        lines.append(current_line)
    return lines or [""]
