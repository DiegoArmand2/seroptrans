from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.usuario import Usuario
from app.models.rol import Rol, RolUsuario
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate
from app.core.security import get_password_hash


def get_usuario_by_id(db: Session, usuario_id: str) -> Optional[Usuario]:
    return db.query(Usuario).filter(Usuario.usuario_id == usuario_id).first()


def get_usuario_by_login(db: Session, login: str) -> Optional[Usuario]:
    return db.query(Usuario).filter(Usuario.login == login).first()


def get_usuarios(db: Session, skip: int = 0, limit: int = 100) -> List[Usuario]:
    return db.query(Usuario).offset(skip).limit(limit).all()


def create_usuario(db: Session, usuario: UsuarioCreate, creado_por_id: Optional[str] = None) -> Usuario:
    db_usuario = Usuario(
        login=usuario.login,
        password=get_password_hash(usuario.password),
        nombre_usuario=usuario.nombre_usuario,
        email=usuario.email,
        telefono=usuario.telefono,
        direccion=usuario.direccion,
        creado_por=creado_por_id,
    )
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario


def update_usuario(db: Session, usuario_id: str, usuario_update: UsuarioUpdate, actualizado_por_id: Optional[str] = None) -> Optional[Usuario]:
    db_usuario = get_usuario_by_id(db, usuario_id)
    if not db_usuario:
        return None
    data = usuario_update.model_dump(exclude_unset=True)
    if "password" in data and data["password"]:
        data["password"] = get_password_hash(data["password"])
    elif "password" in data:
        del data["password"]
    for key, value in data.items():
        setattr(db_usuario, key, value)
    if actualizado_por_id is not None:
        from datetime import datetime
        db_usuario.fecha_actualizacion = datetime.utcnow()
        db_usuario.actualizado_por = actualizado_por_id
    db.commit()
    db.refresh(db_usuario)
    return db_usuario


def delete_usuario(db: Session, usuario_id: str) -> bool:
    db_usuario = get_usuario_by_id(db, usuario_id)
    if not db_usuario:
        return False
    db.delete(db_usuario)
    db.commit()
    return True


def get_user_roles(db: Session, usuario_id: str) -> List[str]:
    rol_usuarios = db.query(RolUsuario).filter(RolUsuario.usuario_id == usuario_id).all()
    roles = []
    for ru in rol_usuarios:
        rol = db.query(Rol).filter(Rol.rol_id == ru.rol_id).first()
        if rol:
            roles.append(rol.nombre)
    return roles


def assign_rol_to_usuario(db: Session, usuario_id: str, rol_id: str, creado_por_id: Optional[str] = None) -> Optional[RolUsuario]:
    existing = db.query(RolUsuario).filter(
        RolUsuario.usuario_id == usuario_id,
        RolUsuario.rol_id == rol_id,
    ).first()
    if existing:
        return existing
    rol_usuario = RolUsuario(usuario_id=usuario_id, rol_id=rol_id, creado_por=creado_por_id)
    db.add(rol_usuario)
    db.commit()
    db.refresh(rol_usuario)
    return rol_usuario


def remove_rol_from_usuario(db: Session, usuario_id: str, rol_id: str) -> bool:
    rol_usuario = db.query(RolUsuario).filter(
        RolUsuario.usuario_id == usuario_id,
        RolUsuario.rol_id == rol_id,
    ).first()
    if not rol_usuario:
        return False
    db.delete(rol_usuario)
    db.commit()
    return True


def sync_roles_usuario(db: Session, usuario_id: str, rol_ids: List[str], actualizado_por_id: Optional[str] = None) -> None:
    """Sincroniza los roles del usuario: elimina los no presentes y añade los que faltan."""
    current = db.query(RolUsuario).filter(RolUsuario.usuario_id == usuario_id).all()
    current_ids = {ru.rol_id for ru in current}
    target_ids = set(rol_ids)

    for ru in current:
        if ru.rol_id not in target_ids:
            db.delete(ru)
    for rol_id in target_ids:
        if rol_id not in current_ids:
            db.add(RolUsuario(usuario_id=usuario_id, rol_id=rol_id, creado_por=actualizado_por_id))
    db.commit()
