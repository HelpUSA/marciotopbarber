import base64
import hashlib
import hmac
import secrets


SCRYPT_N = 2**14
SCRYPT_R = 8
SCRYPT_P = 1
SCRYPT_LENGTH = 64


class InvalidPasswordHashError(ValueError):
    pass


def _encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii")


def _decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value.encode("ascii"))


def hash_password(password: str) -> str:
    if len(password) < 10:
        raise ValueError(
            "A senha deve possuir pelo menos 10 caracteres."
        )

    salt = secrets.token_bytes(16)

    derived = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=SCRYPT_N,
        r=SCRYPT_R,
        p=SCRYPT_P,
        dklen=SCRYPT_LENGTH,
    )

    return (
        f"scrypt${SCRYPT_N}${SCRYPT_R}${SCRYPT_P}$"
        f"{_encode(salt)}${_encode(derived)}"
    )


def verify_password(
    password: str,
    encoded_hash: str,
) -> bool:
    try:
        (
            algorithm,
            raw_n,
            raw_r,
            raw_p,
            raw_salt,
            raw_hash,
        ) = encoded_hash.split("$", maxsplit=5)

        if algorithm != "scrypt":
            return False

        salt = _decode(raw_salt)
        expected = _decode(raw_hash)

        calculated = hashlib.scrypt(
            password.encode("utf-8"),
            salt=salt,
            n=int(raw_n),
            r=int(raw_r),
            p=int(raw_p),
            dklen=len(expected),
        )
    except (
        ValueError,
        TypeError,
        base64.binascii.Error,
    ) as exc:
        raise InvalidPasswordHashError(
            "Hash de senha inválido."
        ) from exc

    return hmac.compare_digest(
        calculated,
        expected,
    )


def generate_session_token() -> str:
    return secrets.token_urlsafe(48)


def hash_session_token(token: str) -> str:
    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()