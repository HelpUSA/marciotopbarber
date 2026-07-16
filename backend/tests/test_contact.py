import pytest


@pytest.mark.parametrize(
    "path",
    [
        "/send-email",
        "/api/v1/contact",
    ],
)
def test_contact_requires_configuration(
    client,
    path,
):
    response = client.post(
        path,
        data={
            "nome": "Cliente Teste",
            "email": "cliente@example.com",
            "mensagem": "Quero agendar um horário.",
        },
    )

    assert response.status_code == 503

    assert response.json() == {
        "detail": (
            "Serviço de contato não configurado."
        )
    }


def test_contact_form_validation(client):
    response = client.post(
        "/api/v1/contact",
        data={
            "nome": "A",
            "email": "email-invalido",
            "mensagem": "Oi",
        },
    )

    assert response.status_code == 422
