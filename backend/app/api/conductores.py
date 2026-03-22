from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_required
from app.models.usuario import Usuario
from app.schemas.conductor import ConductorCreate, ConductorUpdate, ConductorResponse
from app.services.conductor_service import (
    get_conductores,
    get_conductor_by_id,
    create_conductor,
    update_conductor,
    delete_conductor,
    assign_conductor_to_proyecto,
    remove_conductor_from_proyecto,
    assign_ruta_to_conductor,
    remove_ruta_from_conductor,
)
from app.services.permisos_service import get_user_proyectos, can_access_conductor, can_access_proyecto
from app.services.proyecto_service import get_proyecto_by_id
from app.services.ruta_service import get_ruta_by_id

router = APIRouter()


def _to_response(db: Session, obj) -> ConductorResponse:
    d = ConductorResponse.model_validate(obj).model_dump()
    proyectos_rel = getattr(obj, "proyectos", []) or []
    d["proyecto_nombres"] = [pc.proyecto.nombre for pc in proyectos_rel if pc.proyecto]
    d["proyecto_ids"] = [pc.proyecto_id for pc in proyectos_rel]
    if getattr(obj, "creado_por", None):
        u = db.query(Usuario).filter(Usuario.usuario_id == obj.creado_por).first()
        d["creado_por_nombre"] = u.nombre_usuario if u else obj.creado_por
    if getattr(obj, "actualizado_por", None):
        u = db.query(Usuario).filter(Usuario.usuario_id == obj.actualizado_por).first()
        d["actualizado_por_nombre"] = u.nombre_usuario if u else obj.actualizado_por
    return ConductorResponse(**d)


@router.get("", response_model=List[ConductorResponse])
def list_conductores(
    proyecto_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    allowed = get_user_proyectos(db, current_user.usuario_id)
    return [_to_response(db, c) for c in get_conductores(db, proyecto_id=proyecto_id, allowed_proyecto_ids=allowed, skip=skip, limit=limit)]


@router.post("", response_model=ConductorResponse, status_code=status.HTTP_201_CREATED)
def crear_conductor(
    conductor: ConductorCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    c = create_conductor(db, conductor, creado_por_id=current_user.usuario_id)
    return _to_response(db, c)


@router.get("/{conductor_id}", response_model=ConductorResponse)
def obtener_conductor(
    conductor_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    c = get_conductor_by_id(db, conductor_id)
    if not c:
        raise HTTPException(status_code=404, detail="Conductor no encontrado")
    if not can_access_conductor(db, current_user.usuario_id, c):
        raise HTTPException(status_code=404, detail="Conductor no encontrado")
    return _to_response(db, c)


@router.put("/{conductor_id}", response_model=ConductorResponse)
def actualizar_conductor(
    conductor_id: str,
    conductor: ConductorUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    c = get_conductor_by_id(db, conductor_id)
    if not c or not can_access_conductor(db, current_user.usuario_id, c):
        raise HTTPException(status_code=404, detail="Conductor no encontrado")
    updated = update_conductor(db, conductor_id, conductor, actualizado_por_id=current_user.usuario_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Conductor no encontrado")
    return _to_response(db, updated)


@router.delete("/{conductor_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_conductor(
    conductor_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    c = get_conductor_by_id(db, conductor_id)
    if not c or not can_access_conductor(db, current_user.usuario_id, c):
        raise HTTPException(status_code=404, detail="Conductor no encontrado")
    if not delete_conductor(db, conductor_id):
        raise HTTPException(status_code=404, detail="Conductor no encontrado")


@router.post("/{conductor_id}/proyectos/{proyecto_id}")
def asignar_proyecto(
    conductor_id: str,
    proyecto_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    c = get_conductor_by_id(db, conductor_id)
    if not c:
        raise HTTPException(status_code=404, detail="Conductor no encontrado")
    if not get_proyecto_by_id(db, proyecto_id):
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    if not can_access_proyecto(db, current_user.usuario_id, proyecto_id):
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    assign_conductor_to_proyecto(db, proyecto_id, conductor_id, creado_por_id=current_user.usuario_id)
    return {"message": "Conductor asignado al proyecto"}


@router.delete("/{conductor_id}/proyectos/{proyecto_id}")
def quitar_proyecto(
    conductor_id: str,
    proyecto_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    if not can_access_proyecto(db, current_user.usuario_id, proyecto_id):
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    if not remove_conductor_from_proyecto(db, proyecto_id, conductor_id):
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    return {"message": "Conductor removido del proyecto"}
