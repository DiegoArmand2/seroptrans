from typing import List, Optional, Tuple

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.pasajero import Pasajero
from app.schemas.pasajero import PasajeroCreate, PasajeroUpdate


def get_pasajero_by_id(db: Session, pasajero_id: str) -> Optional[Pasajero]:
    return db.query(Pasajero).filter(Pasajero.pasajero_id == pasajero_id).first()


def get_pasajero_by_proyecto_y_cedula(db: Session, proyecto_id: str, cedula: str) -> Optional[Pasajero]:
    """Primera coincidencia por proyecto y cédula normalizada (strip)."""
    c = (cedula or "").strip()
    if not c or not (proyecto_id or "").strip():
        return None
    return (
        db.query(Pasajero)
        .filter(Pasajero.proyecto_id == proyecto_id.strip(), Pasajero.cedula == c)
        .first()
    )


def _pasajeros_base_query(
    db: Session,
    proyecto_id: Optional[str] = None,
    allowed_proyecto_ids: Optional[List[str]] = None,
    q: Optional[str] = None,
):
    if allowed_proyecto_ids is not None and len(allowed_proyecto_ids) == 0:
        return None
    query = db.query(Pasajero)
    if allowed_proyecto_ids is not None:
        query = query.filter(Pasajero.proyecto_id.in_(allowed_proyecto_ids))
    if proyecto_id:
        query = query.filter(Pasajero.proyecto_id == proyecto_id)
    if q:
        term = f"%{q.strip()}%"
        query = query.filter(or_(Pasajero.nombre.ilike(term), Pasajero.cedula.ilike(term)))
    return query


def get_pasajeros(
    db: Session,
    proyecto_id: Optional[str] = None,
    allowed_proyecto_ids: Optional[List[str]] = None,
    q: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[Pasajero]:
    base = _pasajeros_base_query(
        db, proyecto_id=proyecto_id, allowed_proyecto_ids=allowed_proyecto_ids, q=q
    )
    if base is None:
        return []
    return (
        base.order_by(Pasajero.nombre.asc(), Pasajero.cedula.asc(), Pasajero.pasajero_id.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_pasajeros_paged(
    db: Session,
    proyecto_id: Optional[str] = None,
    allowed_proyecto_ids: Optional[List[str]] = None,
    q: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> Tuple[List[Pasajero], int]:
    base = _pasajeros_base_query(
        db, proyecto_id=proyecto_id, allowed_proyecto_ids=allowed_proyecto_ids, q=q
    )
    if base is None:
        return [], 0
    total = (
        base.with_entities(func.count(Pasajero.pasajero_id))
        .order_by(None)
        .scalar()
    )
    items = (
        base.order_by(Pasajero.nombre.asc(), Pasajero.cedula.asc(), Pasajero.pasajero_id.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return items, int(total or 0)


def create_pasajero(db: Session, pasajero: PasajeroCreate, creado_por_id: Optional[str] = None) -> Pasajero:
    plain_pw = (pasajero.contrasena or "").strip()
    db_pasajero = Pasajero(
        proyecto_id=pasajero.proyecto_id,
        cedula=pasajero.cedula,
        nombre=pasajero.nombre,
        direccion=pasajero.direccion,
        lat=pasajero.lat,
        lng=pasajero.lng,
        ruta_id=pasajero.ruta_id,
        tipo_pasajero_id=pasajero.tipo_pasajero_id,
        horario_habitual=pasajero.horario_habitual,
        placa_asignada=pasajero.placa_asignada,
        password_hash=get_password_hash(plain_pw) if plain_pw else None,
        activo=pasajero.activo,
        creado_por=creado_por_id,
    )
    db.add(db_pasajero)
    db.commit()
    db.refresh(db_pasajero)
    return db_pasajero


def update_pasajero(db: Session, pasajero_id: str, pasajero_update: PasajeroUpdate, actualizado_por_id: Optional[str] = None) -> Optional[Pasajero]:
    db_pasajero = get_pasajero_by_id(db, pasajero_id)
    if not db_pasajero:
        return None
    data = pasajero_update.model_dump(exclude_unset=True)
    if "contrasena" in data:
        raw = data.pop("contrasena")
        plain = (raw or "").strip() if raw is not None else ""
        if plain:
            db_pasajero.password_hash = get_password_hash(plain)
    for key, value in data.items():
        setattr(db_pasajero, key, value)
    if actualizado_por_id is not None:
        from datetime import datetime
        db_pasajero.fecha_actualizacion = datetime.utcnow()
        db_pasajero.actualizado_por = actualizado_por_id
    db.commit()
    db.refresh(db_pasajero)
    return db_pasajero


def delete_pasajero(db: Session, pasajero_id: str) -> bool:
    db_pasajero = get_pasajero_by_id(db, pasajero_id)
    if not db_pasajero:
        return False
    db.delete(db_pasajero)
    db.commit()
    return True
