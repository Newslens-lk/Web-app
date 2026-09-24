import base64
import hashlib
import hmac
import secrets
import time

from app.core.config import get_settings

_HASH_ITERATIONS = 600_000
_SALT_BYTES = 16
_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(_SALT_BYTES)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), salt, _HASH_ITERATIONS
    )
    return f"pbkdf2_sha256${_HASH_ITERATIONS}${_encode(salt)}${_encode(digest)}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, iterations, salt, expected = stored_hash.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        actual = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode(),
            _decode(salt),
            int(iterations),
        )
        return hmac.compare_digest(actual, _decode(expected))
    except (TypeError, ValueError):
        return False


def create_session_token(user_id: int) -> str:
    expires_at = int(time.time()) + _SESSION_TTL_SECONDS
    payload = f"{user_id}.{expires_at}".encode()
    signature = hmac.new(_secret(), payload, hashlib.sha256).digest()
    return f"{_encode(payload)}.{_encode(signature)}"


def read_session_token(token: str) -> int | None:
    try:
        encoded_payload, encoded_signature = token.split(".", 1)
        payload = _decode(encoded_payload)
        expected_signature = hmac.new(_secret(), payload, hashlib.sha256).digest()
        if not hmac.compare_digest(expected_signature, _decode(encoded_signature)):
            return None

        user_id, expires_at = payload.decode().split(".", 1)
        if int(expires_at) < int(time.time()):
            return None
        return int(user_id)
    except (TypeError, ValueError, UnicodeDecodeError):
        return None


def _secret() -> bytes:
    return get_settings().auth_secret.encode()


def _encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode().rstrip("=")


def _decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))
