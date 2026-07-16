def test_health(client):
    response = client.get("/health")

    assert response.status_code == 200

    payload = response.json()

    assert payload["status"] == "ok"
    assert payload["service"] == "Marcio TopBarber API"
    assert payload["version"] == "1.1.0"
    assert payload["environment"] == "test"

    assert response.headers["X-Request-ID"]


def test_versioned_health(client):
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_openapi(client):
    response = client.get("/openapi.json")

    assert response.status_code == 200
    assert response.json()["info"]["title"] == (
        "Marcio TopBarber API"
    )
