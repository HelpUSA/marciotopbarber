from email.message import EmailMessage

from aiosmtplib import SMTP

from app.core.config import Settings


class EmailDeliveryError(RuntimeError):
    pass


async def send_contact_email(
    settings: Settings,
    name: str,
    email: str,
    message: str,
) -> None:
    safe_name = " ".join(name.splitlines()).strip()
    safe_message = message.strip()

    owner_message = EmailMessage()
    owner_message["Subject"] = (
        f"Novo contato de {safe_name} via Marcio TopBarber"
    )
    owner_message["From"] = settings.email_from_address
    owner_message["To"] = settings.email_receiver
    owner_message["Reply-To"] = email
    owner_message.set_content(
        f"Nome: {safe_name}\n"
        f"Email: {email}\n\n"
        f"Mensagem:\n{safe_message}\n"
    )

    client_message = EmailMessage()
    client_message["Subject"] = (
        "Confirmação de contato - Marcio TopBarber"
    )
    client_message["From"] = settings.email_from_address
    client_message["To"] = email
    client_message.set_content(
        f"Olá, {safe_name}.\n\n"
        "Recebemos sua mensagem e entraremos "
        "em contato em breve.\n\n"
        f"Mensagem enviada:\n{safe_message}\n\n"
        "Atenciosamente,\n"
        "Marcio TopBarber"
    )

    use_tls = settings.email_use_tls
    start_tls = settings.email_start_tls

    if use_tls:
        start_tls = False

    smtp = SMTP(
        hostname=settings.email_host,
        port=settings.email_port,
        use_tls=use_tls,
        start_tls=start_tls,
        timeout=20,
    )

    connected = False

    try:
        await smtp.connect()
        connected = True

        await smtp.login(
            settings.email_username,
            settings.email_password,
        )

        await smtp.send_message(owner_message)
        await smtp.send_message(client_message)
    except Exception as exc:
        raise EmailDeliveryError(
            "SMTP delivery failed."
        ) from exc
    finally:
        if connected:
            try:
                await smtp.quit()
            except Exception:
                pass
