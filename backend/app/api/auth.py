from fastapi import (
    APIRouter,
    BackgroundTasks,
    Cookie,
    Depends,
    HTTPException,
    Response,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.email import send_email
from app.core.security import (
    create_session_token,
    hash_password,
    read_session_token,
    verify_password,
)
from app.db.session import get_db
from app.emails.welcome import build_welcome_email
from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])
SESSION_COOKIE = "newslens_session"


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    response: Response,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    email = payload.email.lower()
    existing = db.scalar(select(User).where(User.email == email))
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    display_name = payload.display_name.strip()
    user = User(
        email=email,
        display_name=display_name,
        password_hash=hash_password(payload.password),
        role="user",
        locale=payload.locale,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    _set_session_cookie(response, user.id)

    # Queued rather than sent inline: the response goes out first, so signup
    # stays fast and a slow or failing email provider cannot turn a created
    # account into an error the reader sees.
    message = build_welcome_email(display_name=display_name, locale=user.locale)
    background_tasks.add_task(
        send_email,
        to=user.email,
        subject=message.subject,
        html=message.html,
        text=message.text,
    )

    return AuthResponse(user=UserResponse.model_validate(user))


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    email = payload.email.lower()
    user = db.scalar(select(User).where(User.email == email))
    if not user or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    _set_session_cookie(response, user.id)
    return AuthResponse(user=UserResponse.model_validate(user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response):
    response.delete_cookie(SESSION_COOKIE, path="/")


@router.get("/me", response_model=UserResponse)
def get_current_user(
    session: str | None = Cookie(default=None, alias=SESSION_COOKIE),
    db: Session = Depends(get_db),
):
    user_id = read_session_token(session) if session else None
    user = db.get(User, user_id) if user_id else None
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return UserResponse.model_validate(user)


def require_admin(
    session: str | None = Cookie(default=None, alias=SESSION_COOKIE),
    db: Session = Depends(get_db),
) -> User:
    user_id = read_session_token(session) if session else None
    user = db.get(User, user_id) if user_id else None
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def _set_session_cookie(response: Response, user_id: int) -> None:
    settings = get_settings()
    is_production = settings.environment == "production"
    response.set_cookie(
        key=SESSION_COOKIE,
        value=create_session_token(user_id),
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
        path="/",
    )
