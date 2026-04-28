from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.turno_personal import TurnoPersonal
from app.schemas.turno_personal import TurnoPersonalCreate, TurnoPersonalUpdate


def get_turno_personal_by_id(db: Session, turno_personal_id: str) -> Optional[TurnoPersonal]:
    return db.query(TurnoPersonal).filter(TurnoPersonal.turno_personal_id == turno_personal_id).first()


def get_turnos_personal(
    db: Session,
    *,
    horario_importacion_id: Optional[str] = None,
    proyecto_id: Optional[str] = None,
    allowed_proyecto_ids: Optional[List[str]] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[TurnoPersonal]:
    if allowed_proyecto_ids is not None and len(allowed_proyecto_ids) == 0:
        return []
    q = db.query(TurnoPersonal)
    if allowed_proyecto_ids is not None:
        q = q.filter(TurnoPersonal.proyecto_id.in_(allowed_proyecto_ids))
    if proyecto_id:
        q = q.filter(TurnoPersonal.proyecto_id == proyecto_id)
    if horario_importacion_id:
        q = q.filter(TurnoPersonal.horario_importacion_id == horario_importacion_id)
    return q.offset(skip).limit(limit).all()


def create_turno_personal(
    db: Session,
    turno_personal: TurnoPersonalCreate,
    creado_por_id: Optional[str] = None,
) -> TurnoPersonal:
    obj = TurnoPersonal(
        proyecto_id=turno_personal.proyecto_id,
        horario_importacion_id=turno_personal.horario_importacion_id,
        pasajero_id=turno_personal.pasajero_id,
        empresa=turno_personal.empresa,
        proceso=turno_personal.proceso,
        cargo=turno_personal.cargo,
        rut=turno_personal.rut,
        apellidos=turno_personal.apellidos,
        funcionarios=turno_personal.funcionarios,
        dia_09=turno_personal.dia_09,
        dia_10=turno_personal.dia_10,
        dia_11=turno_personal.dia_11,
        dia_12=turno_personal.dia_12,
        dia_13=turno_personal.dia_13,
        dia_14=turno_personal.dia_14,
        dia_15=turno_personal.dia_15,
        creado_por=creado_por_id,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_turno_personal(
    db: Session,
    turno_personal_id: str,
    turno_personal_update: TurnoPersonalUpdate,
    actualizado_por_id: Optional[str] = None,
) -> Optional[TurnoPersonal]:
    obj = get_turno_personal_by_id(db, turno_personal_id)
    if not obj:
        return None
    data = turno_personal_update.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(obj, key, value)
    if actualizado_por_id is not None:
        from datetime import datetime
        obj.fecha_actualizacion = datetime.utcnow()
        obj.actualizado_por = actualizado_por_id
    db.commit()
    db.refresh(obj)
    return obj


def delete_turno_personal(db: Session, turno_personal_id: str) -> bool:
    obj = get_turno_personal_by_id(db, turno_personal_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True

