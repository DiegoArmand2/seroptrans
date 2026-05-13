from typing import List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.ruta import Ruta
from app.schemas.ruta import RutaCreate, RutaUpdate


def _ruta_codigo_punto_taken(
    db: Session,
    proyecto_id: str,
    codigo: Optional[str],
    punto_inicio: str,
    exclude_ruta_id: Optional[str] = None,
) -> bool:
    if not codigo or not str(codigo).strip():
        return False
    c = str(codigo).strip()
    q = db.query(Ruta).filter(
        Ruta.proyecto_id == proyecto_id,
        Ruta.codigo == c,
        Ruta.punto_inicio == punto_inicio,
    )
    if exclude_ruta_id:
        q = q.filter(Ruta.ruta_id != exclude_ruta_id)
    return q.first() is not None


def get_ruta_by_id(db: Session, ruta_id: str) -> Optional[Ruta]:
    return db.query(Ruta).filter(Ruta.ruta_id == ruta_id).first()


def get_rutas_by_nombre_y_proyecto(db: Session, proyecto_id: str, nombre: str) -> List[Ruta]:
    """Rutas del proyecto cuyo nombre coincide sin distinguir mayúsculas (trim)."""
    n = (nombre or "").strip()
    if not n:
        return []
    return (
        db.query(Ruta)
        .filter(Ruta.proyecto_id == proyecto_id)
        .filter(func.lower(Ruta.nombre) == n.lower())
        .all()
    )


def get_rutas(
    db: Session,
    proyecto_id: Optional[str] = None,
    allowed_proyecto_ids: Optional[List[str]] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[Ruta]:
    if allowed_proyecto_ids is not None and len(allowed_proyecto_ids) == 0:
        return []
    q = db.query(Ruta)
    if allowed_proyecto_ids is not None:
        q = q.filter(Ruta.proyecto_id.in_(allowed_proyecto_ids))
    if proyecto_id:
        q = q.filter(Ruta.proyecto_id == proyecto_id)
    return q.offset(skip).limit(limit).all()


def create_ruta(db: Session, ruta: RutaCreate, creado_por_id: Optional[str] = None) -> Ruta:
    if _ruta_codigo_punto_taken(db, ruta.proyecto_id, ruta.codigo, ruta.punto_inicio):
        raise ValueError(
            "Ya existe una ruta con el mismo código y punto de inicio en este proyecto."
        )
    db_ruta = Ruta(
        proyecto_id=ruta.proyecto_id,
        nombre=ruta.nombre,
        codigo=ruta.codigo,
        punto_inicio=ruta.punto_inicio,
        sector=ruta.sector,
        geocerca=ruta.geocerca,
        costo_base=ruta.costo_base,
        tipo=ruta.tipo,
        activo=ruta.activo,
        creado_por=creado_por_id,
    )
    db.add(db_ruta)
    db.commit()
    db.refresh(db_ruta)
    return db_ruta


def update_ruta(db: Session, ruta_id: str, ruta_update: RutaUpdate, actualizado_por_id: Optional[str] = None) -> Optional[Ruta]:
    db_ruta = get_ruta_by_id(db, ruta_id)
    if not db_ruta:
        return None
    data = ruta_update.model_dump(exclude_unset=True)
    next_codigo = data["codigo"] if "codigo" in data else db_ruta.codigo
    next_punto = data["punto_inicio"] if "punto_inicio" in data else db_ruta.punto_inicio
    if _ruta_codigo_punto_taken(
        db, db_ruta.proyecto_id, next_codigo, next_punto, exclude_ruta_id=ruta_id
    ):
        raise ValueError(
            "Ya existe una ruta con el mismo código y punto de inicio en este proyecto."
        )
    for key, value in data.items():
        setattr(db_ruta, key, value)
    if actualizado_por_id is not None:
        from datetime import datetime
        db_ruta.fecha_actualizacion = datetime.utcnow()
        db_ruta.actualizado_por = actualizado_por_id
    db.commit()
    db.refresh(db_ruta)
    return db_ruta


def delete_ruta(db: Session, ruta_id: str) -> bool:
    db_ruta = get_ruta_by_id(db, ruta_id)
    if not db_ruta:
        return False
    db.delete(db_ruta)
    db.commit()
    return True
