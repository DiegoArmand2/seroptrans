from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.vehiculo import Vehiculo
from app.schemas.vehiculo import VehiculoCreate, VehiculoUpdate


def get_vehiculo_by_id(db: Session, vehiculo_id: str) -> Optional[Vehiculo]:
    return db.query(Vehiculo).filter(Vehiculo.vehiculo_id == vehiculo_id).first()


def get_vehiculos(
    db: Session,
    proyecto_id: Optional[str] = None,
    turno_id: Optional[str] = None,
    allowed_proyecto_ids: Optional[List[str]] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[Vehiculo]:
    if allowed_proyecto_ids is not None and len(allowed_proyecto_ids) == 0:
        return []
    q = db.query(Vehiculo)
    if allowed_proyecto_ids is not None:
        q = q.filter(Vehiculo.proyecto_id.in_(allowed_proyecto_ids))
    if proyecto_id:
        q = q.filter(Vehiculo.proyecto_id == proyecto_id)
    if turno_id:
        q = q.filter(Vehiculo.turno_id == turno_id)
    return q.offset(skip).limit(limit).all()


def create_vehiculo(db: Session, vehiculo: VehiculoCreate, creado_por_id: Optional[str] = None) -> Vehiculo:
    db_vehiculo = Vehiculo(
        placa=vehiculo.placa,
        capacidad=vehiculo.capacidad,
        conductor_id=vehiculo.conductor_id,
        turno_id=vehiculo.turno_id,
        proyecto_id=vehiculo.proyecto_id,
        activo=vehiculo.activo,
        creado_por=creado_por_id,
    )
    db.add(db_vehiculo)
    db.commit()
    db.refresh(db_vehiculo)
    return db_vehiculo


def update_vehiculo(
    db: Session, vehiculo_id: str, vehiculo_update: VehiculoUpdate, actualizado_por_id: Optional[str] = None
) -> Optional[Vehiculo]:
    db_vehiculo = get_vehiculo_by_id(db, vehiculo_id)
    if not db_vehiculo:
        return None
    data = vehiculo_update.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(db_vehiculo, key, value)
    if actualizado_por_id is not None:
        from datetime import datetime
        db_vehiculo.fecha_actualizacion = datetime.utcnow()
        db_vehiculo.actualizado_por = actualizado_por_id
    db.commit()
    db.refresh(db_vehiculo)
    return db_vehiculo


def delete_vehiculo(db: Session, vehiculo_id: str) -> bool:
    db_vehiculo = get_vehiculo_by_id(db, vehiculo_id)
    if not db_vehiculo:
        return False
    db.delete(db_vehiculo)
    db.commit()
    return True
