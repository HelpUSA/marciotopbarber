from email.message import EmailMessage
import os

from aiosmtplib import SMTP
from dotenv import load_dotenv
from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import EmailStr

load_dotenv()


def env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)

    if value is None:
        return default

    return value.strip().lower() in {"1", "true", "yes", "on"}


def allowed_origins() -> list[str]:
    raw_value = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )

    return [
        origin.strip()
        for origin in raw_value.split(",")
        if origin.strip()
    ]


app = FastAPI(
    title="Marcio TopBarber API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/send-email")
async def send_email(
    nome: str = Form(..., min_length=2, max_length=120),
    email: EmailStr = Form(...),
    mensagem: str = Form(..., min_length=5, max_length=4000),
) -> dict[str, object]:
    smtp_host = os.getenv("EMAIL_HOST")
    smtp_port = os.getenv("EMAIL_PORT")
    smtp_username = os.getenv("EMAIL_USERNAME")
    smtp_password = os.getenv("EMAIL_PASSWORD")
    email_from = os.getenv("EMAIL_FROM") or smtp_username
    email_receiver = os.getenv("EMAIL_RECEIVER")

    required_values = {
        "EMAIL_HOST": smtp_host,
        "EMAIL_PORT": smtp_port,
        "EMAIL_USERNAME": smtp_username,
        "EMAIL_PASSWORD": smtp_password,
        "EMAIL_FROM": email_from,
        "EMAIL_RECEIVER": email_receiver,
    }

    missing = [
        name
        for name, value in required_values.items()
        if not value
    ]

    if missing:
        raise HTTPException(
            status_code=503,
            detail="Serviço de contato não configurado.",
        )

    safe_name = " ".join(nome.splitlines()).strip()
    safe_message = mensagem.strip()

    owner_message = EmailMessage()
    owner_message["Subject"] = (
        f"Novo contato de {safe_name} via Marcio TopBarber"
    )
    owner_message["From"] = email_from
    owner_message["To"] = email_receiver
    owner_message["Reply-To"] = str(email)
    owner_message.set_content(
        f"Nome: {safe_name}\n"
        f"Email: {email}\n\n"
        f"Mensagem:\n{safe_message}\n"
    )

    client_message = EmailMessage()
    client_message["Subject"] = (
        "Confirmação de contato - Marcio TopBarber"
    )
    client_message["From"] = email_from
    client_message["To"] = str(email)
    client_message.set_content(
        f"Olá, {safe_name}.\n\n"
        "Recebemos sua mensagem e entraremos em contato em breve.\n\n"
        f"Mensagem enviada:\n{safe_message}\n\n"
        "Atenciosamente,\n"
        "Marcio TopBarber"
    )

    use_tls = env_bool("EMAIL_USE_TLS", False)
    start_tls = env_bool("EMAIL_START_TLS", True)

    if use_tls:
        start_tls = False

    smtp = SMTP(
        hostname=smtp_host,
        port=int(smtp_port),
        use_tls=use_tls,
        start_tls=start_tls,
        timeout=20,
    )

    connected = False

    try:
        await smtp.connect()
        connected = True
        await smtp.login(smtp_username, smtp_password)
        await smtp.send_message(owner_message)
        await smtp.send_message(client_message)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail="Não foi possível enviar a mensagem.",
        ) from exc
    finally:
        if connected:
            try:
                await smtp.quit()
            except Exception:
                pass

    return {
        "success": True,
        "message": "Mensagem enviada com sucesso.",
    }
