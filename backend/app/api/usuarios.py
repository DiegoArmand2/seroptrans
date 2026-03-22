from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_required
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate, UsuarioResponse, UsuarioList, RolAsignado, RolIdsSync


def _build_roles(db: Session, u: Usuario) -> list:
    from app.models.rol import Rol
    roles_data = []
    for ru in u.roles:
        rol = db.query(Rol).filter(Rol.rol_id == ru.rol_id).first()
        if rol:
            roles_data.append({"rol_id": rol.rol_id, "nombre": rol.nombre})
    return roles_data


def _usuario_to_response(db: Session, u: Usuario) -> UsuarioResponse:
    """Convierte Usuario a UsuarioResponse con nombres de auditoría y roles."""
    d = {
        "usuario_id": u.usuario_id,
        "login": u.login,
        "nombre_usuario": u.nombre_usuario,
        "email": u.email,
        "telefono": u.telefono,
        "direccion": u.direccion,
        "fecha_creacion": getattr(u, "fecha_creacion", None),
        "creado_por": getattr(u, "creado_por", None),
        "fecha_actualizacion": getattr(u, "fecha_actualizacion", None),
        "actualizado_por": getattr(u, "actualizado_por", None),
    }
    if getattr(u, "creado_por", None):
        cu = db.query(Usuario).filter(Usuario.usuario_id == u.creado_por).first()
        d["creado_por_nombre"] = cu.nombre_usuario if cu else u.creado_por
    if getattr(u, "actualizado_por", None):
        au = db.query(Usuario).filter(Usuario.usuario_id == u.actualizado_por).first()
        d["actualizado_por_nombre"] = au.nombre_usuario if au else u.actualizado_por
    d["roles"] = [RolAsignado(**r) for r in _build_roles(db, u)]
    return UsuarioResponse(**d)


def _usuario_to_list_item(db: Session, u: Usuario) -> UsuarioList:
    """Convierte Usuario a UsuarioList para el listado."""
    role_names = [r["nombre"] for r in _build_roles(db, u)]
    return UsuarioList(
        usuario_id=u.usuario_id,
        login=u.login,
        nombre_usuario=u.nombre_usuario,
        email=u.email,
        roles=role_names,
    )
from app.services.usuario_service import (
    get_usuarios,
    get_usuario_by_id,
    get_usuario_by_login,
    create_usuario,
    update_usuario,
    delete_usuario,
    assign_rol_to_usuario,
    remove_rol_from_usuario,
    sync_roles_usuario,
)

router = APIRouter()


@router.get("", response_model=List[UsuarioList])
def list_usuarios(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    usuarios = get_usuarios(db, skip=skip, limit=limit)
    return [_usuario_to_list_item(db, u) for u in usuarios]


@router.post("", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def crear_usuario(
    usuario: UsuarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    if get_usuario_by_login(db, usuario.login):
        raise HTTPException(status_code=400, detail="El login ya existe")
    u = create_usuario(db, usuario, creado_por_id=current_user.usuario_id)
    return _usuario_to_response(db, u)


@router.get("/{usuario_id}", response_model=UsuarioResponse)
def obtener_usuario(
    usuario_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    user = get_usuario_by_id(db, usuario_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return _usuario_to_response(db, user)


@router.put("/{usuario_id}", response_model=UsuarioResponse)
def actualizar_usuario(
    usuario_id: str,
    usuario: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    updated = update_usuario(db, usuario_id, usuario, actualizado_por_id=current_user.usuario_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return _usuario_to_response(db, updated)


@router.delete("/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_usuario(
    usuario_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    if not delete_usuario(db, usuario_id):
        raise HTTPException(status_code=404, detail="Usuario no encontrado")


@router.post("/{usuario_id}/roles/{rol_id}")
def asignar_rol(
    usuario_id: str,
    rol_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    if not get_usuario_by_id(db, usuario_id):
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    from app.services.rol_service import get_rol_by_id
    if not get_rol_by_id(db, rol_id):
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    assign_rol_to_usuario(db, usuario_id, rol_id, creado_por_id=current_user.usuario_id)
    return {"message": "Rol asignado correctamente"}


@router.delete("/{usuario_id}/roles/{rol_id}")
def quitar_rol(
    usuario_id: str,
    rol_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    if not remove_rol_from_usuario(db, usuario_id, rol_id):
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    return {"message": "Rol removido correctamente"}


@router.put("/{usuario_id}/roles")
def sincronizar_roles(
    usuario_id: str,
    body: RolIdsSync,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    if not get_usuario_by_id(db, usuario_id):
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    sync_roles_usuario(db, usuario_id, body.rol_ids, actualizado_por_id=current_user.usuario_id)
    return {"message": "Roles sincronizados correctamente"}
