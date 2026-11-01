import hashlib
import hmac
from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

from app.core.config import settings

_password_hash = PasswordHash.recommended()
_jwt_secret = settings.jwt_secret_key.get_secret_value()
_token_key = _jwt_secret.encode("utf-8")


def hash_password(password: str) -> str:
    return _password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return _password_hash.verify(password, hashed_password)


def create_access_token(organizer_id: int) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)
    return jwt.encode(
        {"sub": str(organizer_id), "exp": expires_at},
        _jwt_secret,
        algorithm="HS256",
    )


def decode_access_token(token: str) -> str:
    payload = jwt.decode(token, _jwt_secret, algorithms=["HS256"])
    subject = payload.get("sub")
    if not isinstance(subject, str) or not subject.isdigit():
        raise jwt.InvalidTokenError("Invalid organizer subject.")
    return subject


def hash_secret_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def hash_email_code(code: str, event_id: int, participant_id: int) -> str:
    message = f"eventcheck-email-code:{event_id}:{participant_id}:{code}".encode()
    return hmac.new(_token_key, message, hashlib.sha256).hexdigest()


def derive_ticket_token(access_token: str) -> str:
    message = b"eventcheck-ticket-v1:" + access_token.encode("utf-8")
    return hmac.new(_token_key, message, hashlib.sha256).hexdigest()
