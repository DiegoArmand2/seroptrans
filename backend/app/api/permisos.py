from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_required
from app.models.usuario import Usuario
from app.services.permisos_service import get_user_ventanas, get_user_procesos

router = APIRouter()


@router.get("/me/ventanas")
def mis_ventanas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    return {"ventanas": get_user_ventanas(db, current_user.usuario_id)}


@router.get("/me/procesos")
def mis_procesos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    return {"procesos": get_user_procesos(db, current_user.usuario_id)}
