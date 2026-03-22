from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_required
from app.models.usuario import Usuario
from app.schemas.rol import (
    RolCreate,
    RolUpdate,
    RolResponse,
    RolPermisoVentanaCreate,
    RolPermisoVentanaResponse,
    RolPermisoProcesoCreate,
    RolPermisoProcesoResponse,
    RolPermisoVentanaAdd,
    RolPermisoProcesoAdd,
    RolPermisoProyectoAdd,
    RolPermisoProyectoResponse,
)
from app.services.rol_service import (
    get_roles,
    get_rol_by_id,
    create_rol,
    update_rol,
    delete_rol,
    get_permisos_ventana,
    add_permiso_ventana,
    remove_permiso_ventana,
    get_permisos_proceso,
    add_permiso_proceso,
    remove_permiso_proceso,
    get_permisos_proyecto,
    add_permiso_proyecto,
    remove_permiso_proyecto,
)

router = APIRouter()


def _rol_to_response(db: Session, r) -> RolResponse:
    """Convierte Rol a RolResponse con nombres de auditoría."""
    d = RolResponse.model_validate(r).model_dump()
    if getattr(r, "creado_por", None):
        cu = db.query(Usuario).filter(Usuario.usuario_id == r.creado_por).first()
        d["creado_por_nombre"] = cu.nombre_usuario if cu else r.creado_por
    if getattr(r, "actualizado_por", None):
        au = db.query(Usuario).filter(Usuario.usuario_id == r.actualizado_por).first()
        d["actualizado_por_nombre"] = au.nombre_usuario if au else r.actualizado_por
    return RolResponse(**d)


@router.get("", response_model=List[RolResponse])
def list_roles(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    return get_roles(db, skip=skip, limit=limit)


@router.post("", response_model=RolResponse, status_code=status.HTTP_201_CREATED)
def crear_rol(
    rol: RolCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    r = create_rol(db, rol, creado_por_id=current_user.usuario_id)
    return _rol_to_response(db, r)


@router.get("/{rol_id}", response_model=RolResponse)
def obtener_rol(
    rol_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    r = get_rol_by_id(db, rol_id)
    if not r:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    return _rol_to_response(db, r)


@router.put("/{rol_id}", response_model=RolResponse)
def actualizar_rol(
    rol_id: str,
    rol: RolUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    updated = update_rol(db, rol_id, rol, actualizado_por_id=current_user.usuario_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    return _rol_to_response(db, updated)


@router.delete("/{rol_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_rol(
    rol_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    if not delete_rol(db, rol_id):
        raise HTTPException(status_code=404, detail="Rol no encontrado")


# Permisos por ventana
@router.get("/{rol_id}/ventanas", response_model=List[RolPermisoVentanaResponse])
def list_permisos_ventana(
    rol_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    if not get_rol_by_id(db, rol_id):
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    return get_permisos_ventana(db, rol_id)


@router.post("/{rol_id}/ventanas", response_model=RolPermisoVentanaResponse, status_code=status.HTTP_201_CREATED)
def agregar_permiso_ventana(
    rol_id: str,
    body: RolPermisoVentanaAdd,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    if not get_rol_by_id(db, rol_id):
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    permiso = RolPermisoVentanaCreate(rol_id=rol_id, ventana=body.ventana)
    return add_permiso_ventana(db, permiso, creado_por_id=current_user.usuario_id)


@router.delete("/{rol_id}/ventanas/{rolwin_id}")
def quitar_permiso_ventana(
    rol_id: str,
    rolwin_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    if not remove_permiso_ventana(db, rolwin_id):
        raise HTTPException(status_code=404, detail="Permiso no encontrado")
    return {"message": "Permiso removido"}


# Permisos por proceso
@router.get("/{rol_id}/procesos", response_model=List[RolPermisoProcesoResponse])
def list_permisos_proceso(
    rol_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    if not get_rol_by_id(db, rol_id):
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    return get_permisos_proceso(db, rol_id)


@router.post("/{rol_id}/procesos", response_model=RolPermisoProcesoResponse, status_code=status.HTTP_201_CREATED)
def agregar_permiso_proceso(
    rol_id: str,
    body: RolPermisoProcesoAdd,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    if not get_rol_by_id(db, rol_id):
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    permiso = RolPermisoProcesoCreate(rol_id=rol_id, proceso=body.proceso)
    return add_permiso_proceso(db, permiso, creado_por_id=current_user.usuario_id)


@router.delete("/{rol_id}/procesos/{rolpro_id}")
def quitar_permiso_proceso(
    rol_id: str,
    rolpro_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    if not remove_permiso_proceso(db, rolpro_id):
        raise HTTPException(status_code=404, detail="Permiso no encontrado")
    return {"message": "Permiso removido"}


# Permisos por proyecto
@router.get("/{rol_id}/proyectos", response_model=List[RolPermisoProyectoResponse])
def list_permisos_proyecto(
    rol_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    if not get_rol_by_id(db, rol_id):
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    return get_permisos_proyecto(db, rol_id)


@router.post("/{rol_id}/proyectos", response_model=RolPermisoProyectoResponse, status_code=status.HTTP_201_CREATED)
def agregar_permiso_proyecto(
    rol_id: str,
    body: RolPermisoProyectoAdd,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    if not get_rol_by_id(db, rol_id):
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    permiso = add_permiso_proyecto(db, rol_id, body.proyecto_id, creado_por_id=current_user.usuario_id)
    return permiso


@router.delete("/{rol_id}/proyectos/{rolproy_id}")
def quitar_permiso_proyecto(
    rol_id: str,
    rolproy_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    if not remove_permiso_proyecto(db, rolproy_id):
        raise HTTPException(status_code=404, detail="Permiso no encontrado")
    return {"message": "Permiso removido"}
