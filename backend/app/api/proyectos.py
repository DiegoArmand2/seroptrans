from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_required
from app.models.usuario import Usuario
from app.schemas.proyecto import ProyectoCreate, ProyectoUpdate, ProyectoResponse
from app.services.proyecto_service import (
    get_proyectos,
    get_proyecto_by_id,
    create_proyecto,
    update_proyecto,
    delete_proyecto,
)
from app.services.permisos_service import get_user_proyectos, can_access_proyecto

router = APIRouter()


def _to_response(db: Session, obj) -> ProyectoResponse:
    d = ProyectoResponse.model_validate(obj).model_dump()
    if getattr(obj, "creado_por", None):
        u = db.query(Usuario).filter(Usuario.usuario_id == obj.creado_por).first()
        d["creado_por_nombre"] = u.nombre_usuario if u else obj.creado_por
    if getattr(obj, "actualizado_por", None):
        u = db.query(Usuario).filter(Usuario.usuario_id == obj.actualizado_por).first()
        d["actualizado_por_nombre"] = u.nombre_usuario if u else obj.actualizado_por
    return ProyectoResponse(**d)


@router.get("", response_model=List[ProyectoResponse])
def list_proyectos(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    proyecto_ids = get_user_proyectos(db, current_user.usuario_id)
    return [_to_response(db, p) for p in get_proyectos(db, proyecto_ids=proyecto_ids, skip=skip, limit=limit)]


@router.post("", response_model=ProyectoResponse, status_code=status.HTTP_201_CREATED)
def crear_proyecto(
    proyecto: ProyectoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    p = create_proyecto(db, proyecto, creado_por_id=current_user.usuario_id)
    return _to_response(db, p)


@router.get("/{proyecto_id}", response_model=ProyectoResponse)
def obtener_proyecto(
    proyecto_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    p = get_proyecto_by_id(db, proyecto_id)
    if not p:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    if not can_access_proyecto(db, current_user.usuario_id, proyecto_id):
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    return _to_response(db, p)


@router.put("/{proyecto_id}", response_model=ProyectoResponse)
def actualizar_proyecto(
    proyecto_id: str,
    proyecto: ProyectoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    if not can_access_proyecto(db, current_user.usuario_id, proyecto_id):
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    updated = update_proyecto(db, proyecto_id, proyecto, actualizado_por_id=current_user.usuario_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    return _to_response(db, updated)


@router.delete("/{proyecto_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_proyecto(
    proyecto_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    if not can_access_proyecto(db, current_user.usuario_id, proyecto_id):
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    if not delete_proyecto(db, proyecto_id):
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
