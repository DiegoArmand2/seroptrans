from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.pasajero import Pasajero
from app.schemas.pasajero import PasajeroCreate, PasajeroUpdate


def get_pasajero_by_id(db: Session, pasajero_id: str) -> Optional[Pasajero]:
    return db.query(Pasajero).filter(Pasajero.pasajero_id == pasajero_id).first()


def get_pasajeros(
    db: Session,
    proyecto_id: Optional[str] = None,
    allowed_proyecto_ids: Optional[List[str]] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[Pasajero]:
    if allowed_proyecto_ids is not None and len(allowed_proyecto_ids) == 0:
        return []
    q = db.query(Pasajero)
    if allowed_proyecto_ids is not None:
        q = q.filter(Pasajero.proyecto_id.in_(allowed_proyecto_ids))
    if proyecto_id:
        q = q.filter(Pasajero.proyecto_id == proyecto_id)
    return q.offset(skip).limit(limit).all()


def create_pasajero(db: Session, pasajero: PasajeroCreate, creado_por_id: Optional[str] = None) -> Pasajero:
    db_pasajero = Pasajero(
        proyecto_id=pasajero.proyecto_id,
        cedula=pasajero.cedula,
        nombre=pasajero.nombre,
        direccion=pasajero.direccion,
        lat=pasajero.lat,
        lng=pasajero.lng,
        ruta_id=pasajero.ruta_id,
        horario_habitual=pasajero.horario_habitual,
        placa_asignada=pasajero.placa_asignada,
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
