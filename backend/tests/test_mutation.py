from tests.test_integration import client


def test_regression_health_check_still_works():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_regression_notes_endpoint_still_returns_list():
    response = client.get("/notes/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)