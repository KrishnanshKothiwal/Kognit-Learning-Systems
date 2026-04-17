from fastapi.testclient import TestClient
from main import app
import security
import models
from database import SessionLocal
from datetime import datetime


def override_get_current_user():
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == "demo@kognit.com").first()
        if not user:
            user = models.User(
                email="demo@kognit.com",
                hashed_password="dummy",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(user)
            try:
                db.commit()
                db.refresh(user)
            except Exception:
                db.rollback()
                user = db.query(models.User).filter(models.User.email == "demo@kognit.com").first()
        return user
    finally:
        db.close()


app.dependency_overrides[security.get_current_user] = override_get_current_user

client = TestClient(app)


def test_integration_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] == "healthy"


def test_integration_get_current_user_profile():
    response = client.get("/users/me")
    assert response.status_code == 200
    data = response.json()
    assert "email" in data
    assert data["email"] == "demo@kognit.com"


def test_integration_notes_list_endpoint():
    response = client.get("/notes/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)