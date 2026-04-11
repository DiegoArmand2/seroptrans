from typing import List, Optional


from sqlalchemy.orm import Session

from app.models.rol import Rol, RolUsuario, RolPermisoVentana, RolPermisoProceso, RolPermisoProyecto
from app.schemas.rol import RolCreate, RolUpdate, RolPermisoVentanaCreate, RolPermisoProcesoCreate
from app.services.permisos_service import normalize_proceso_key, normalize_ventana_key


def get_rol_by_id(db: Session, rol_id: str) -> Optional[Rol]:
    return db.query(Rol).filter(Rol.rol_id == rol_id).first()


def get_roles(db: Session, skip: int = 0, limit: int = 100) -> List[Rol]:
    return db.query(Rol).offset(skip).limit(limit).all()


def create_rol(db: Session, rol: RolCreate, creado_por_id: Optional[str] = None) -> Rol:
    db_rol = Rol(nombre=rol.nombre, descripcion=rol.descripcion, creado_por=creado_por_id)
    db.add(db_rol)
    db.commit()
    db.refresh(db_rol)
    return db_rol


def update_rol(db: Session, rol_id: str, rol_update: RolUpdate, actualizado_por_id: Optional[str] = None) -> Optional[Rol]:
    db_rol = get_rol_by_id(db, rol_id)
    if not db_rol:
        return None
    data = rol_update.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(db_rol, key, value)
    if actualizado_por_id is not None:
        from datetime import datetime
        db_rol.fecha_actualizacion = datetime.utcnow()
        db_rol.actualizado_por = actualizado_por_id
    db.commit()
    db.refresh(db_rol)
    return db_rol


def delete_rol(db: Session, rol_id: str) -> bool:
    db_rol = get_rol_by_id(db, rol_id)
    if not db_rol:
        return False
    db.delete(db_rol)
    db.commit()
    return True


def get_permisos_ventana(db: Session, rol_id: str) -> List[RolPermisoVentana]:
    return db.query(RolPermisoVentana).filter(RolPermisoVentana.rol_id == rol_id).all()


def add_permiso_ventana(db: Session, permiso: RolPermisoVentanaCreate, creado_por_id: Optional[str] = None) -> RolPermisoVentana:
    ventana = normalize_ventana_key(permiso.ventana)
    db_permiso = RolPermisoVentana(rol_id=permiso.rol_id, ventana=ventana, creado_por=creado_por_id)
    db.add(db_permiso)
    db.commit()
    db.refresh(db_permiso)
    return db_permiso


def remove_permiso_ventana(db: Session, rolwin_id: str) -> bool:
    permiso = db.query(RolPermisoVentana).filter(RolPermisoVentana.rolwin_id == rolwin_id).first()
    if not permiso:
        return False
    db.delete(permiso)
    db.commit()
    return True


def get_permisos_proceso(db: Session, rol_id: str) -> List[RolPermisoProceso]:
    return db.query(RolPermisoProceso).filter(RolPermisoProceso.rol_id == rol_id).all()


def add_permiso_proceso(db: Session, permiso: RolPermisoProcesoCreate, creado_por_id: Optional[str] = None) -> RolPermisoProceso:
    proceso = normalize_proceso_key(permiso.proceso)
    db_permiso = RolPermisoProceso(rol_id=permiso.rol_id, proceso=proceso, creado_por=creado_por_id)
    db.add(db_permiso)
    db.commit()
    db.refresh(db_permiso)
    return db_permiso


def remove_permiso_proceso(db: Session, rolpro_id: str) -> bool:
    permiso = db.query(RolPermisoProceso).filter(RolPermisoProceso.rolpro_id == rolpro_id).first()
    if not permiso:
        return False
    db.delete(permiso)
    db.commit()
    return True


def get_permisos_proyecto(db: Session, rol_id: str) -> List[RolPermisoProyecto]:
    return db.query(RolPermisoProyecto).filter(RolPermisoProyecto.rol_id == rol_id).all()


def add_permiso_proyecto(db: Session, rol_id: str, proyecto_id: str, creado_por_id: Optional[str] = None) -> RolPermisoProyecto:
    existing = db.query(RolPermisoProyecto).filter(
        RolPermisoProyecto.rol_id == rol_id,
        RolPermisoProyecto.proyecto_id == proyecto_id,
    ).first()
    if existing:
        return existing
    permiso = RolPermisoProyecto(rol_id=rol_id, proyecto_id=proyecto_id, creado_por=creado_por_id)
    db.add(permiso)
    db.commit()
    db.refresh(permiso)
    return permiso


def remove_permiso_proyecto(db: Session, rolproy_id: str) -> bool:
    permiso = db.query(RolPermisoProyecto).filter(RolPermisoProyecto.rolproy_id == rolproy_id).first()
    if not permiso:
        return False
    db.delete(permiso)
    db.commit()
    return True
