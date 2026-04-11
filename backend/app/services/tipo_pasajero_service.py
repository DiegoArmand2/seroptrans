from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.tipo_pasajero import TipoPasajero
from app.schemas.tipo_pasajero import TipoPasajeroCreate, TipoPasajeroUpdate


def get_tipo_pasajero_by_id(db: Session, tipo_pasajero_id: str) -> Optional[TipoPasajero]:
    return db.query(TipoPasajero).filter(TipoPasajero.tipo_pasajero_id == tipo_pasajero_id).first()


def get_tipos_pasajero(
    db: Session,
    proyecto_id: Optional[str] = None,
    allowed_proyecto_ids: Optional[List[str]] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[TipoPasajero]:
    if allowed_proyecto_ids is not None and len(allowed_proyecto_ids) == 0:
        return []
    q = db.query(TipoPasajero)
    if allowed_proyecto_ids is not None:
        q = q.filter(TipoPasajero.proyecto_id.in_(allowed_proyecto_ids))
    if proyecto_id:
        q = q.filter(TipoPasajero.proyecto_id == proyecto_id)
    return q.offset(skip).limit(limit).all()


def create_tipo_pasajero(
    db: Session, data: TipoPasajeroCreate, creado_por_id: Optional[str] = None
) -> TipoPasajero:
    obj = TipoPasajero(
        proyecto_id=data.proyecto_id,
        codigo=data.codigo.strip(),
        nombre=data.nombre,
        descripcion=data.descripcion,
        activo=data.activo,
        creado_por=creado_por_id,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_tipo_pasajero(
    db: Session, tipo_pasajero_id: str, data: TipoPasajeroUpdate, actualizado_por_id: Optional[str] = None
) -> Optional[TipoPasajero]:
    obj = get_tipo_pasajero_by_id(db, tipo_pasajero_id)
    if not obj:
        return None
    fields = data.model_dump(exclude_unset=True)
    if "codigo" in fields and fields["codigo"] is not None:
        fields["codigo"] = fields["codigo"].strip()
    for key, value in fields.items():
        setattr(obj, key, value)
    if actualizado_por_id is not None:
        from datetime import datetime

        obj.fecha_actualizacion = datetime.utcnow()
        obj.actualizado_por = actualizado_por_id
    db.commit()
    db.refresh(obj)
    return obj


def delete_tipo_pasajero(db: Session, tipo_pasajero_id: str) -> bool:
    obj = get_tipo_pasajero_by_id(db, tipo_pasajero_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True
