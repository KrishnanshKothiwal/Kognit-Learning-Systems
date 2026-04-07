from pydantic import BaseModel, EmailStr
import datetime

# Properties to receive via API on user creation
class UserCreate(BaseModel):
    email: EmailStr
    password: str

# Properties to return via API, hiding the password
class User(BaseModel):
    user_id: int
    email: EmailStr
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str

class UserUpdate(BaseModel):
    email: str | None = None
    current_password: str | None = None
    new_password: str | None = None