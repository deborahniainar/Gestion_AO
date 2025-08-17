from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from .config import JWT_SECRET


ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    return password_context.hash(plain_password)


def verify_password(plain_password: str, hashed_or_plain_password: str) -> bool:
    # Support both hashed and legacy plain-text passwords
    if hashed_or_plain_password.startswith("$2b$") or hashed_or_plain_password.startswith("$2a$"):
        return password_context.verify(plain_password, hashed_or_plain_password)
    return plain_password == hashed_or_plain_password


def create_access_token(subject: str | int, expires_delta: Optional[timedelta] = None, extra_claims: Optional[dict[str, Any]] = None) -> str:
    if expires_delta is None:
        expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode: dict[str, Any] = {"sub": str(subject), "exp": expire}
    if extra_claims:
        to_encode.update(extra_claims)
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict[str, Any]]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


