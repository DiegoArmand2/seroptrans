from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.rol import Rol, RolUsuario, RolPermisoVentana, RolPermisoProceso, RolPermisoProyecto


def normalize_ventana_key(v: Optional[str]) -> str:
    """Clave única para comparar ventanas (evita 'Proyecto' vs 'proyecto' en menú y API)."""
    return (v or "").strip().lower()


def normalize_proceso_key(v: Optional[str]) -> str:
    return (v or "").strip().lower()


def get_user_ventanas(db: Session, usuario_id: str) -> List[str]:
    """Obtiene la lista de ventanas a las que el usuario tiene acceso según sus roles."""
    rol_usuarios = db.query(RolUsuario).filter(RolUsuario.usuario_id == usuario_id).all()
    rol_ids = [ru.rol_id for ru in rol_usuarios]
    if not rol_ids:
        return []
    permisos = db.query(RolPermisoVentana.ventana).filter(
        RolPermisoVentana.rol_id.in_(rol_ids)
    ).distinct().all()
    keys = [normalize_ventana_key(p[0]) for p in permisos if p[0] is not None]
    return list(dict.fromkeys(keys))


def get_user_procesos(db: Session, usuario_id: str) -> List[str]:
    """Obtiene la lista de procesos que el usuario puede ejecutar según sus roles."""
    rol_usuarios = db.query(RolUsuario).filter(RolUsuario.usuario_id == usuario_id).all()
    rol_ids = [ru.rol_id for ru in rol_usuarios]
    if not rol_ids:
        return []
    permisos = db.query(RolPermisoProceso.proceso).filter(
        RolPermisoProceso.rol_id.in_(rol_ids)
    ).distinct().all()
    keys = [normalize_proceso_key(p[0]) for p in permisos if p[0] is not None]
    return list(dict.fromkeys(keys))


def has_ventana(db: Session, usuario_id: str, ventana: str) -> bool:
    return normalize_ventana_key(ventana) in get_user_ventanas(db, usuario_id)


def has_proceso(db: Session, usuario_id: str, proceso: str) -> bool:
    return normalize_proceso_key(proceso) in get_user_procesos(db, usuario_id)


def get_user_proyectos(db: Session, usuario_id: str) -> Optional[List[str]]:
    """
    Obtiene los proyecto_ids a los que el usuario tiene acceso.
    Retorna None si es Administrador (acceso a todos).
    Retorna lista de proyecto_ids para otros roles.
    """
    rol_usuarios = db.query(RolUsuario).filter(RolUsuario.usuario_id == usuario_id).all()
    rol_ids = [ru.rol_id for ru in rol_usuarios]
    if not rol_ids:
        return []

    # Administrador tiene acceso a todos los proyectos
    admin_rol = db.query(Rol).filter(Rol.nombre == "Administrador", Rol.rol_id.in_(rol_ids)).first()
    if admin_rol:
        return None

    permisos = (
        db.query(RolPermisoProyecto.proyecto_id)
        .filter(RolPermisoProyecto.rol_id.in_(rol_ids))
        .distinct()
        .all()
    )
    return [p[0] for p in permisos]


def can_access_proyecto(db: Session, usuario_id: str, proyecto_id: str) -> bool:
    """
    Verifica si el usuario tiene acceso al proyecto indicado.
    Retorna True si es Administrador o si proyecto_id está en sus permisos.
    """
    allowed = get_user_proyectos(db, usuario_id)
    if allowed is None:
        return True  # Admin
    if not allowed:
        return False
    return proyecto_id in allowed


def get_proyecto_ids_for_catalog(db: Session, usuario_id: str) -> Optional[List[str]]:
    """
    Ámbito de proyectos para el CRUD /proyectos (menú Proyecto).
    Si el rol no tiene filas en rol_permiso_proyecto pero sí ventana "proyecto",
    puede ver y editar todos los proyectos del catálogo sin asignarlos uno a uno.
    El resto de módulos sigue usando solo get_user_proyectos().
    """
    allowed = get_user_proyectos(db, usuario_id)
    if allowed is None:
        return None
    if not allowed and has_ventana(db, usuario_id, "proyecto"):
        return None
    return allowed


def can_access_proyecto_catalog(db: Session, usuario_id: str, proyecto_id: str) -> bool:
    """Acceso a un registro del catálogo /proyectos (lista, detalle, actualizar, borrar)."""
    allowed = get_user_proyectos(db, usuario_id)
    if allowed is None:
        return True
    if allowed and proyecto_id in allowed:
        return True
    if not allowed and has_ventana(db, usuario_id, "proyecto"):
        return True
    return False


def can_access_conductor(db: Session, usuario_id: str, conductor) -> bool:
    """
    Verifica si el usuario tiene acceso al conductor (ligado a proyectos vía ProyectoConductor).
    Retorna True si es Admin o si alguno de los proyectos del conductor está en los permisos.
    """
    allowed = get_user_proyectos(db, usuario_id)
    if allowed is None:
        return True
    if not allowed:
        return False
    proyectos_rel = getattr(conductor, "proyectos", []) or []
    conductor_proyecto_ids = [pc.proyecto_id for pc in proyectos_rel]
    return any(pid in allowed for pid in conductor_proyecto_ids)
