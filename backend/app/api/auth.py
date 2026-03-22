from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_current_user_required
from app.core.config import settings
from app.models.usuario import Usuario
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.usuario_service import get_usuario_by_login, get_user_roles
from app.services.permisos_service import get_user_ventanas, get_user_procesos, get_user_proyectos

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    user = get_usuario_by_login(db, credentials.login)
    if not user or not verify_password(credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Login o contraseña incorrectos",
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.usuario_id},
        expires_delta=access_token_expires,
    )
    roles = get_user_roles(db, user.usuario_id)
    ventanas = get_user_ventanas(db, user.usuario_id)
    procesos = get_user_procesos(db, user.usuario_id)
    proyectos = get_user_proyectos(db, user.usuario_id)
    return TokenResponse(
        access_token=access_token,
        user={
            "usuario_id": user.usuario_id,
            "login": user.login,
            "nombre_usuario": user.nombre_usuario,
            "email": user.email,
            "roles": roles,
            "ventanas": ventanas,
            "procesos": procesos,
            "proyectos": proyectos,
        },
    )


@router.get("/me")
def get_me(current_user: Usuario = Depends(get_current_user_required), db: Session = Depends(get_db)):
    roles = get_user_roles(db, current_user.usuario_id)
    ventanas = get_user_ventanas(db, current_user.usuario_id)
    procesos = get_user_procesos(db, current_user.usuario_id)
    proyectos = get_user_proyectos(db, current_user.usuario_id)
    return {
        "usuario_id": current_user.usuario_id,
        "login": current_user.login,
        "nombre_usuario": current_user.nombre_usuario,
        "email": current_user.email,
        "roles": roles,
        "ventanas": ventanas,
        "procesos": procesos,
        "proyectos": proyectos,
    }
