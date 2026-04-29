from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.ruta import Ruta
from app.models.tipo_vehiculo import TipoVehiculo
from app.models.vehiculo import Vehiculo
from app.schemas.vehiculo import VehiculoCreate, VehiculoUpdate


def _tipo_vehiculo_matches_proyecto(db: Session, tipo_vehiculo_id: Optional[str], proyecto_id: str) -> bool:
    if tipo_vehiculo_id is None:
        return True
    tv = db.query(TipoVehiculo).filter(TipoVehiculo.tipo_vehiculo_id == tipo_vehiculo_id).first()
    return tv is not None and tv.proyecto_id == proyecto_id


def _ruta_matches_proyecto(db: Session, ruta_id: Optional[str], proyecto_id: str) -> bool:
    if ruta_id is None:
        return True
    r = db.query(Ruta).filter(Ruta.ruta_id == ruta_id).first()
    return r is not None and r.proyecto_id == proyecto_id


def get_vehiculo_by_id(db: Session, vehiculo_id: str) -> Optional[Vehiculo]:
    return db.query(Vehiculo).filter(Vehiculo.vehiculo_id == vehiculo_id).first()


def get_vehiculos(
    db: Session,
    proyecto_id: Optional[str] = None,
    ruta_id: Optional[str] = None,
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
    if ruta_id:
        q = q.filter(Vehiculo.ruta_id == ruta_id)
    return q.offset(skip).limit(limit).all()


def create_vehiculo(db: Session, vehiculo: VehiculoCreate, creado_por_id: Optional[str] = None) -> Vehiculo:
    if not _ruta_matches_proyecto(db, vehiculo.ruta_id, vehiculo.proyecto_id):
        raise ValueError("La ruta no pertenece al proyecto del vehículo")
    if not _tipo_vehiculo_matches_proyecto(db, vehiculo.tipo_vehiculo_id, vehiculo.proyecto_id):
        raise ValueError("El tipo de vehículo no pertenece al proyecto del vehículo")
    db_vehiculo = Vehiculo(
        placa=vehiculo.placa,
        capacidad=vehiculo.capacidad,
        conductor_id=vehiculo.conductor_id,
        ruta_id=vehiculo.ruta_id,
        proyecto_id=vehiculo.proyecto_id,
        tipo_vehiculo_id=vehiculo.tipo_vehiculo_id,
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
    if "ruta_id" in data:
        if not _ruta_matches_proyecto(db, data.get("ruta_id"), db_vehiculo.proyecto_id):
            raise ValueError("La ruta no pertenece al proyecto del vehículo")
    if "tipo_vehiculo_id" in data:
        if not _tipo_vehiculo_matches_proyecto(db, data["tipo_vehiculo_id"], db_vehiculo.proyecto_id):
            raise ValueError("El tipo de vehículo no pertenece al proyecto del vehículo")
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
