from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_required
from app.models.usuario import Usuario
from app.schemas.ruta import RutaCreate, RutaUpdate, RutaResponse
from app.services.permisos_service import get_user_proyectos, can_access_proyecto
from app.services.ruta_service import (
    get_rutas,
    get_ruta_by_id,
    create_ruta,
    update_ruta,
    delete_ruta,
)

router = APIRouter()


def _to_response(db: Session, obj) -> RutaResponse:
    d = RutaResponse.model_validate(obj).model_dump()
    if getattr(obj, "creado_por", None):
        u = db.query(Usuario).filter(Usuario.usuario_id == obj.creado_por).first()
        d["creado_por_nombre"] = u.nombre_usuario if u else obj.creado_por
    if getattr(obj, "actualizado_por", None):
        u = db.query(Usuario).filter(Usuario.usuario_id == obj.actualizado_por).first()
        d["actualizado_por_nombre"] = u.nombre_usuario if u else obj.actualizado_por
    return RutaResponse(**d)


@router.get("", response_model=List[RutaResponse])
def list_rutas(
    proyecto_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    allowed = get_user_proyectos(db, current_user.usuario_id)
    return [_to_response(db, r) for r in get_rutas(db, proyecto_id=proyecto_id, allowed_proyecto_ids=allowed, skip=skip, limit=limit)]


@router.post("", response_model=RutaResponse, status_code=status.HTTP_201_CREATED)
def crear_ruta(
    ruta: RutaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    if not can_access_proyecto(db, current_user.usuario_id, ruta.proyecto_id):
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    r = create_ruta(db, ruta, creado_por_id=current_user.usuario_id)
    return _to_response(db, r)


@router.get("/{ruta_id}", response_model=RutaResponse)
def obtener_ruta(
    ruta_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    r = get_ruta_by_id(db, ruta_id)
    if not r:
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
    if not can_access_proyecto(db, current_user.usuario_id, r.proyecto_id):
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
    return _to_response(db, r)


@router.put("/{ruta_id}", response_model=RutaResponse)
def actualizar_ruta(
    ruta_id: str,
    ruta: RutaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    r = get_ruta_by_id(db, ruta_id)
    if not r or not can_access_proyecto(db, current_user.usuario_id, r.proyecto_id):
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
    updated = update_ruta(db, ruta_id, ruta, actualizado_por_id=current_user.usuario_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
    return _to_response(db, updated)


@router.delete("/{ruta_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_ruta(
    ruta_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    r = get_ruta_by_id(db, ruta_id)
    if not r or not can_access_proyecto(db, current_user.usuario_id, r.proyecto_id):
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
    if not delete_ruta(db, ruta_id):
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
