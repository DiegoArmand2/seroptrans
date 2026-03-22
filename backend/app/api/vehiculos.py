from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_required
from app.models.usuario import Usuario
from app.schemas.vehiculo import VehiculoCreate, VehiculoUpdate, VehiculoResponse
from app.services.permisos_service import get_user_proyectos, can_access_proyecto
from app.services.vehiculo_service import (
    get_vehiculos,
    get_vehiculo_by_id,
    create_vehiculo,
    update_vehiculo,
    delete_vehiculo,
)

router = APIRouter()


def _to_response(db: Session, obj) -> VehiculoResponse:
    d = {
        "vehiculo_id": obj.vehiculo_id,
        "placa": obj.placa,
        "capacidad": obj.capacidad,
        "conductor_id": obj.conductor_id,
        "turno_id": obj.turno_id,
        "proyecto_id": obj.proyecto_id,
        "activo": obj.activo,
        "conductor_nombre": obj.conductor.nombre if obj.conductor else None,
        "turno_nombre": obj.turno.nombre if obj.turno else None,
        "fecha_creacion": obj.fecha_creacion,
        "creado_por": obj.creado_por,
        "fecha_actualizacion": obj.fecha_actualizacion,
        "actualizado_por": obj.actualizado_por,
    }
    d["creado_por_nombre"] = None
    d["actualizado_por_nombre"] = None
    if getattr(obj, "creado_por", None):
        u = db.query(Usuario).filter(Usuario.usuario_id == obj.creado_por).first()
        d["creado_por_nombre"] = u.nombre_usuario if u else obj.creado_por
    if getattr(obj, "actualizado_por", None):
        u = db.query(Usuario).filter(Usuario.usuario_id == obj.actualizado_por).first()
        d["actualizado_por_nombre"] = u.nombre_usuario if u else obj.actualizado_por
    return VehiculoResponse(**d)


@router.get("", response_model=List[VehiculoResponse])
def list_vehiculos(
    proyecto_id: Optional[str] = None,
    turno_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    allowed = get_user_proyectos(db, current_user.usuario_id)
    return [_to_response(db, v) for v in get_vehiculos(db, proyecto_id=proyecto_id, turno_id=turno_id, allowed_proyecto_ids=allowed, skip=skip, limit=limit)]


@router.post("", response_model=VehiculoResponse, status_code=status.HTTP_201_CREATED)
def crear_vehiculo(
    vehiculo: VehiculoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    if not can_access_proyecto(db, current_user.usuario_id, vehiculo.proyecto_id):
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    v = create_vehiculo(db, vehiculo, creado_por_id=current_user.usuario_id)
    return _to_response(db, v)


@router.get("/{vehiculo_id}", response_model=VehiculoResponse)
def obtener_vehiculo(
    vehiculo_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    v = get_vehiculo_by_id(db, vehiculo_id)
    if not v:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    if not can_access_proyecto(db, current_user.usuario_id, v.proyecto_id):
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    return _to_response(db, v)


@router.put("/{vehiculo_id}", response_model=VehiculoResponse)
def actualizar_vehiculo(
    vehiculo_id: str,
    vehiculo: VehiculoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    updated = update_vehiculo(db, vehiculo_id, vehiculo, actualizado_por_id=current_user.usuario_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    return _to_response(db, updated)


@router.delete("/{vehiculo_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_vehiculo(
    vehiculo_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    v = get_vehiculo_by_id(db, vehiculo_id)
    if not v or not can_access_proyecto(db, current_user.usuario_id, v.proyecto_id):
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    if not delete_vehiculo(db, vehiculo_id):
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
