from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_required
from app.models.usuario import Usuario
from app.schemas.turno_personal import TurnoPersonalCreate, TurnoPersonalResponse, TurnoPersonalUpdate
from app.services.horario_importacion_service import get_importacion_by_id
from app.services.permisos_service import can_access_proyecto, get_user_proyectos, has_proceso
from app.services.turno_personal_service import (
    create_turno_personal,
    delete_turno_personal,
    get_turno_personal_by_id,
    get_turnos_personal,
    update_turno_personal,
)

router = APIRouter()

PROCESO_EDITAR_TURNOS_PERSONAL_CONFIRMADO = "editar_turnos_personal_confirmado"


def _assert_mutable_si_horario_confirmado(
    db: Session, usuario_id: str, horario_importacion_id: Optional[str]
) -> None:
    hid = (horario_importacion_id or "").strip()
    if not hid:
        return
    imp = get_importacion_by_id(db, hid)
    if imp is None:
        return
    if (imp.estado or "DR") != "CO":
        return
    if not has_proceso(db, usuario_id, PROCESO_EDITAR_TURNOS_PERSONAL_CONFIRMADO):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "El horario está confirmado: no puede crear ni modificar ni eliminar "
                "turnos personal sin el permiso correspondiente."
            ),
        )


def _to_response(db: Session, obj) -> TurnoPersonalResponse:
    d = TurnoPersonalResponse.model_validate(obj).model_dump()
    if getattr(obj, "creado_por", None):
        u = db.query(Usuario).filter(Usuario.usuario_id == obj.creado_por).first()
        d["creado_por_nombre"] = u.nombre_usuario if u else obj.creado_por
    if getattr(obj, "actualizado_por", None):
        u = db.query(Usuario).filter(Usuario.usuario_id == obj.actualizado_por).first()
        d["actualizado_por_nombre"] = u.nombre_usuario if u else obj.actualizado_por
    return TurnoPersonalResponse(**d)


@router.get("", response_model=List[TurnoPersonalResponse])
def list_turnos_personal(
    horario_importacion_id: Optional[str] = None,
    proyecto_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    allowed = get_user_proyectos(db, current_user.usuario_id)
    items = get_turnos_personal(
        db,
        horario_importacion_id=horario_importacion_id,
        proyecto_id=proyecto_id,
        allowed_proyecto_ids=allowed,
        skip=skip,
        limit=limit,
    )
    return [_to_response(db, x) for x in items]


@router.post("", response_model=TurnoPersonalResponse, status_code=status.HTTP_201_CREATED)
def crear_turno_personal_endpoint(
    body: TurnoPersonalCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    if not can_access_proyecto(db, current_user.usuario_id, body.proyecto_id):
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    _assert_mutable_si_horario_confirmado(db, current_user.usuario_id, body.horario_importacion_id)
    created = create_turno_personal(db, body, creado_por_id=current_user.usuario_id)
    return _to_response(db, created)


@router.get("/{turno_personal_id}", response_model=TurnoPersonalResponse)
def obtener_turno_personal_endpoint(
    turno_personal_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    obj = get_turno_personal_by_id(db, turno_personal_id)
    if not obj or not can_access_proyecto(db, current_user.usuario_id, obj.proyecto_id):
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return _to_response(db, obj)


@router.put("/{turno_personal_id}", response_model=TurnoPersonalResponse)
def actualizar_turno_personal_endpoint(
    turno_personal_id: str,
    body: TurnoPersonalUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    obj = get_turno_personal_by_id(db, turno_personal_id)
    if not obj or not can_access_proyecto(db, current_user.usuario_id, obj.proyecto_id):
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    _assert_mutable_si_horario_confirmado(db, current_user.usuario_id, obj.horario_importacion_id)
    updated = update_turno_personal(db, turno_personal_id, body, actualizado_por_id=current_user.usuario_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return _to_response(db, updated)


@router.delete("/{turno_personal_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_turno_personal_endpoint(
    turno_personal_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    obj = get_turno_personal_by_id(db, turno_personal_id)
    if not obj or not can_access_proyecto(db, current_user.usuario_id, obj.proyecto_id):
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    _assert_mutable_si_horario_confirmado(db, current_user.usuario_id, obj.horario_importacion_id)
    if not delete_turno_personal(db, turno_personal_id):
        raise HTTPException(status_code=404, detail="Registro no encontrado")

