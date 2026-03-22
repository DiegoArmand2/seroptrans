from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.conductor import Conductor, ProyectoConductor, ConductorRuta
from app.models.proyecto import Proyecto
from app.models.ruta import Ruta
from app.schemas.conductor import ConductorCreate, ConductorUpdate


def get_conductor_by_id(db: Session, conductor_id: str) -> Optional[Conductor]:
    return db.query(Conductor).filter(Conductor.conductor_id == conductor_id).first()


def get_conductores(
    db: Session,
    proyecto_id: Optional[str] = None,
    allowed_proyecto_ids: Optional[List[str]] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[Conductor]:
    if allowed_proyecto_ids is not None and len(allowed_proyecto_ids) == 0:
        return []
    q = db.query(Conductor)
    if allowed_proyecto_ids is not None or proyecto_id:
        q = q.join(ProyectoConductor)
    if allowed_proyecto_ids is not None:
        q = q.filter(ProyectoConductor.proyecto_id.in_(allowed_proyecto_ids))
    if proyecto_id:
        q = q.filter(ProyectoConductor.proyecto_id == proyecto_id)
    if allowed_proyecto_ids is not None or proyecto_id:
        q = q.distinct()
    return q.offset(skip).limit(limit).all()


def create_conductor(db: Session, conductor: ConductorCreate, creado_por_id: Optional[str] = None) -> Conductor:
    db_conductor = Conductor(
        nombre=conductor.nombre,
        disponible=conductor.disponible,
        activo=conductor.activo,
        creado_por=creado_por_id,
    )
    db.add(db_conductor)
    db.commit()
    db.refresh(db_conductor)
    return db_conductor


def update_conductor(db: Session, conductor_id: str, conductor_update: ConductorUpdate, actualizado_por_id: Optional[str] = None) -> Optional[Conductor]:
    db_conductor = get_conductor_by_id(db, conductor_id)
    if not db_conductor:
        return None
    data = conductor_update.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(db_conductor, key, value)
    if actualizado_por_id is not None:
        from datetime import datetime
        db_conductor.fecha_actualizacion = datetime.utcnow()
        db_conductor.actualizado_por = actualizado_por_id
    db.commit()
    db.refresh(db_conductor)
    return db_conductor


def delete_conductor(db: Session, conductor_id: str) -> bool:
    db_conductor = get_conductor_by_id(db, conductor_id)
    if not db_conductor:
        return False
    db.delete(db_conductor)
    db.commit()
    return True


def assign_conductor_to_proyecto(db: Session, proyecto_id: str, conductor_id: str, creado_por_id: Optional[str] = None) -> Optional[ProyectoConductor]:
    existing = db.query(ProyectoConductor).filter(
        ProyectoConductor.proyecto_id == proyecto_id,
        ProyectoConductor.conductor_id == conductor_id,
    ).first()
    if existing:
        return existing
    pc = ProyectoConductor(proyecto_id=proyecto_id, conductor_id=conductor_id, creado_por=creado_por_id)
    db.add(pc)
    db.commit()
    db.refresh(pc)
    return pc


def remove_conductor_from_proyecto(db: Session, proyecto_id: str, conductor_id: str) -> bool:
    pc = db.query(ProyectoConductor).filter(
        ProyectoConductor.proyecto_id == proyecto_id,
        ProyectoConductor.conductor_id == conductor_id,
    ).first()
    if not pc:
        return False
    db.delete(pc)
    db.commit()
    return True


def assign_ruta_to_conductor(db: Session, conductor_id: str, ruta_id: str, tipo: str, creado_por_id: Optional[str] = None) -> Optional[ConductorRuta]:
    existing = db.query(ConductorRuta).filter(
        ConductorRuta.conductor_id == conductor_id,
        ConductorRuta.ruta_id == ruta_id,
        ConductorRuta.tipo == tipo,
    ).first()
    if existing:
        return existing
    cr = ConductorRuta(conductor_id=conductor_id, ruta_id=ruta_id, tipo=tipo, creado_por=creado_por_id)
    db.add(cr)
    db.commit()
    db.refresh(cr)
    return cr


def remove_ruta_from_conductor(db: Session, conductorruta_id: str) -> bool:
    cr = db.query(ConductorRuta).filter(ConductorRuta.conductorruta_id == conductorruta_id).first()
    if not cr:
        return False
    db.delete(cr)
    db.commit()
    return True
