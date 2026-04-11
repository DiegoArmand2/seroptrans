from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_required
from app.models.usuario import Usuario
from app.schemas.tipo_pasajero import TipoPasajeroCreate, TipoPasajeroUpdate, TipoPasajeroResponse
from app.services.permisos_service import get_user_proyectos, can_access_proyecto
from app.services.tipo_pasajero_service import (
    get_tipos_pasajero,
    get_tipo_pasajero_by_id,
    create_tipo_pasajero,
    update_tipo_pasajero,
    delete_tipo_pasajero,
)

router = APIRouter()


def _to_response(db: Session, obj) -> TipoPasajeroResponse:
    d = TipoPasajeroResponse.model_validate(obj).model_dump()
    if getattr(obj, "creado_por", None):
        u = db.query(Usuario).filter(Usuario.usuario_id == obj.creado_por).first()
        d["creado_por_nombre"] = u.nombre_usuario if u else obj.creado_por
    if getattr(obj, "actualizado_por", None):
        u = db.query(Usuario).filter(Usuario.usuario_id == obj.actualizado_por).first()
        d["actualizado_por_nombre"] = u.nombre_usuario if u else obj.actualizado_por
    return TipoPasajeroResponse(**d)


@router.get("", response_model=List[TipoPasajeroResponse])
def list_tipos_pasajero(
    proyecto_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    allowed = get_user_proyectos(db, current_user.usuario_id)
    return [
        _to_response(db, t)
        for t in get_tipos_pasajero(
            db, proyecto_id=proyecto_id, allowed_proyecto_ids=allowed, skip=skip, limit=limit
        )
    ]


@router.post("", response_model=TipoPasajeroResponse, status_code=status.HTTP_201_CREATED)
def crear_tipo_pasajero(
    body: TipoPasajeroCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    if not can_access_proyecto(db, current_user.usuario_id, body.proyecto_id):
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    t = create_tipo_pasajero(db, body, creado_por_id=current_user.usuario_id)
    return _to_response(db, t)


@router.get("/{tipo_pasajero_id}", response_model=TipoPasajeroResponse)
def obtener_tipo_pasajero(
    tipo_pasajero_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    t = get_tipo_pasajero_by_id(db, tipo_pasajero_id)
    if not t:
        raise HTTPException(status_code=404, detail="Tipo de pasajero no encontrado")
    if not can_access_proyecto(db, current_user.usuario_id, t.proyecto_id):
        raise HTTPException(status_code=404, detail="Tipo de pasajero no encontrado")
    return _to_response(db, t)


@router.put("/{tipo_pasajero_id}", response_model=TipoPasajeroResponse)
def actualizar_tipo_pasajero(
    tipo_pasajero_id: str,
    body: TipoPasajeroUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    t = get_tipo_pasajero_by_id(db, tipo_pasajero_id)
    if not t or not can_access_proyecto(db, current_user.usuario_id, t.proyecto_id):
        raise HTTPException(status_code=404, detail="Tipo de pasajero no encontrado")
    updated = update_tipo_pasajero(db, tipo_pasajero_id, body, actualizado_por_id=current_user.usuario_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Tipo de pasajero no encontrado")
    return _to_response(db, updated)


@router.delete("/{tipo_pasajero_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_tipo_pasajero(
    tipo_pasajero_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    t = get_tipo_pasajero_by_id(db, tipo_pasajero_id)
    if not t or not can_access_proyecto(db, current_user.usuario_id, t.proyecto_id):
        raise HTTPException(status_code=404, detail="Tipo de pasajero no encontrado")
    if not delete_tipo_pasajero(db, tipo_pasajero_id):
        raise HTTPException(status_code=404, detail="Tipo de pasajero no encontrado")
