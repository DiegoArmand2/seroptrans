from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_required
from app.models.usuario import Usuario
from app.schemas.turno import TurnoCreate, TurnoUpdate, TurnoResponse
from app.services.permisos_service import get_user_proyectos, can_access_proyecto
from app.services.turno_service import (
    get_turnos,
    get_turno_by_id,
    create_turno,
    update_turno,
    delete_turno,
)

router = APIRouter()


def _to_response(db: Session, obj) -> TurnoResponse:
    d = TurnoResponse.model_validate(obj).model_dump()
    if getattr(obj, "creado_por", None):
        u = db.query(Usuario).filter(Usuario.usuario_id == obj.creado_por).first()
        d["creado_por_nombre"] = u.nombre_usuario if u else obj.creado_por
    if getattr(obj, "actualizado_por", None):
        u = db.query(Usuario).filter(Usuario.usuario_id == obj.actualizado_por).first()
        d["actualizado_por_nombre"] = u.nombre_usuario if u else obj.actualizado_por
    return TurnoResponse(**d)


@router.get("", response_model=List[TurnoResponse])
def list_turnos(
    proyecto_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    allowed = get_user_proyectos(db, current_user.usuario_id)
    return [_to_response(db, t) for t in get_turnos(db, proyecto_id=proyecto_id, allowed_proyecto_ids=allowed, skip=skip, limit=limit)]


@router.post("", response_model=TurnoResponse, status_code=status.HTTP_201_CREATED)
def crear_turno(
    turno: TurnoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    if not can_access_proyecto(db, current_user.usuario_id, turno.proyecto_id):
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    try:
        t = create_turno(db, turno, creado_por_id=current_user.usuario_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    return _to_response(db, t)


@router.get("/{turno_id}", response_model=TurnoResponse)
def obtener_turno(
    turno_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    t = get_turno_by_id(db, turno_id)
    if not t:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    if not can_access_proyecto(db, current_user.usuario_id, t.proyecto_id):
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    return _to_response(db, t)


@router.put("/{turno_id}", response_model=TurnoResponse)
def actualizar_turno(
    turno_id: str,
    turno: TurnoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    t = get_turno_by_id(db, turno_id)
    if not t or not can_access_proyecto(db, current_user.usuario_id, t.proyecto_id):
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    try:
        updated = update_turno(db, turno_id, turno, actualizado_por_id=current_user.usuario_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    if not updated:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    return _to_response(db, updated)


@router.delete("/{turno_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_turno(
    turno_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    t = get_turno_by_id(db, turno_id)
    if not t or not can_access_proyecto(db, current_user.usuario_id, t.proyecto_id):
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    if not delete_turno(db, turno_id):
        raise HTTPException(status_code=404, detail="Turno no encontrado")
