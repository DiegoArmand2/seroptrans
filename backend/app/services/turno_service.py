from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.turno import Turno
from app.schemas.turno import TurnoCreate, TurnoUpdate


def get_turno_by_id(db: Session, turno_id: str) -> Optional[Turno]:
    return db.query(Turno).filter(Turno.turno_id == turno_id).first()


def get_turnos(
    db: Session,
    proyecto_id: Optional[str] = None,
    allowed_proyecto_ids: Optional[List[str]] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[Turno]:
    if allowed_proyecto_ids is not None and len(allowed_proyecto_ids) == 0:
        return []
    q = db.query(Turno)
    if allowed_proyecto_ids is not None:
        q = q.filter(Turno.proyecto_id.in_(allowed_proyecto_ids))
    if proyecto_id:
        q = q.filter(Turno.proyecto_id == proyecto_id)
    return q.offset(skip).limit(limit).all()


def create_turno(db: Session, turno: TurnoCreate, creado_por_id: Optional[str] = None) -> Turno:
    db_turno = Turno(
        proyecto_id=turno.proyecto_id,
        nombre=turno.nombre,
        descripcion=turno.descripcion,
        activo=turno.activo,
        hora_entrada=turno.hora_entrada,
        hora_salida=turno.hora_salida,
        tipo_turno=turno.tipo_turno,
        tipo_horario=turno.tipo_horario,
        cambio_dia=turno.cambio_dia,
        creado_por=creado_por_id,
    )
    db.add(db_turno)
    db.commit()
    db.refresh(db_turno)
    return db_turno


def update_turno(db: Session, turno_id: str, turno_update: TurnoUpdate, actualizado_por_id: Optional[str] = None) -> Optional[Turno]:
    db_turno = get_turno_by_id(db, turno_id)
    if not db_turno:
        return None
    data = turno_update.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(db_turno, key, value)
    if actualizado_por_id is not None:
        from datetime import datetime
        db_turno.fecha_actualizacion = datetime.utcnow()
        db_turno.actualizado_por = actualizado_por_id
    db.commit()
    db.refresh(db_turno)
    return db_turno


def delete_turno(db: Session, turno_id: str) -> bool:
    db_turno = get_turno_by_id(db, turno_id)
    if not db_turno:
        return False
    db.delete(db_turno)
    db.commit()
    return True
