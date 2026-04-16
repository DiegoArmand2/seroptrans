from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.tipo_vehiculo import TipoVehiculo
from app.schemas.tipo_vehiculo import TipoVehiculoCreate, TipoVehiculoUpdate


def get_tipo_vehiculo_by_id(db: Session, tipo_vehiculo_id: str) -> Optional[TipoVehiculo]:
    return db.query(TipoVehiculo).filter(TipoVehiculo.tipo_vehiculo_id == tipo_vehiculo_id).first()


def get_tipos_vehiculo(
    db: Session,
    proyecto_id: Optional[str] = None,
    allowed_proyecto_ids: Optional[List[str]] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[TipoVehiculo]:
    if allowed_proyecto_ids is not None and len(allowed_proyecto_ids) == 0:
        return []
    q = db.query(TipoVehiculo)
    if allowed_proyecto_ids is not None:
        q = q.filter(TipoVehiculo.proyecto_id.in_(allowed_proyecto_ids))
    if proyecto_id:
        q = q.filter(TipoVehiculo.proyecto_id == proyecto_id)
    return q.offset(skip).limit(limit).all()


def create_tipo_vehiculo(
    db: Session, data: TipoVehiculoCreate, creado_por_id: Optional[str] = None
) -> TipoVehiculo:
    obj = TipoVehiculo(
        proyecto_id=data.proyecto_id,
        identificador=data.identificador.strip(),
        nombre=data.nombre,
        descripcion=data.descripcion,
        activo=data.activo,
        creado_por=creado_por_id,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_tipo_vehiculo(
    db: Session, tipo_vehiculo_id: str, data: TipoVehiculoUpdate, actualizado_por_id: Optional[str] = None
) -> Optional[TipoVehiculo]:
    obj = get_tipo_vehiculo_by_id(db, tipo_vehiculo_id)
    if not obj:
        return None
    fields = data.model_dump(exclude_unset=True)
    if "identificador" in fields and fields["identificador"] is not None:
        fields["identificador"] = fields["identificador"].strip()
    for key, value in fields.items():
        setattr(obj, key, value)
    if actualizado_por_id is not None:
        from datetime import datetime

        obj.fecha_actualizacion = datetime.utcnow()
        obj.actualizado_por = actualizado_por_id
    db.commit()
    db.refresh(obj)
    return obj


def delete_tipo_vehiculo(db: Session, tipo_vehiculo_id: str) -> bool:
    obj = get_tipo_vehiculo_by_id(db, tipo_vehiculo_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True
