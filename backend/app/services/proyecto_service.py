from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.proyecto import Proyecto
from app.schemas.proyecto import ProyectoCreate, ProyectoUpdate


def get_proyecto_by_id(db: Session, proyecto_id: str) -> Optional[Proyecto]:
    return db.query(Proyecto).filter(Proyecto.proyecto_id == proyecto_id).first()


def get_proyectos(db: Session, proyecto_ids: Optional[List[str]] = None, skip: int = 0, limit: int = 100) -> List[Proyecto]:
    q = db.query(Proyecto)
    if proyecto_ids is not None:
        if not proyecto_ids:
            return []
        q = q.filter(Proyecto.proyecto_id.in_(proyecto_ids))
    return q.offset(skip).limit(limit).all()


def create_proyecto(db: Session, proyecto: ProyectoCreate, creado_por_id: Optional[str] = None) -> Proyecto:
    db_proyecto = Proyecto(
        nombre=proyecto.nombre,
        descripcion=proyecto.descripcion,
        parametros_operativos=proyecto.parametros_operativos,
        activo=proyecto.activo,
        creado_por=creado_por_id,
    )
    db.add(db_proyecto)
    db.commit()
    db.refresh(db_proyecto)
    return db_proyecto


def update_proyecto(db: Session, proyecto_id: str, proyecto_update: ProyectoUpdate, actualizado_por_id: Optional[str] = None) -> Optional[Proyecto]:
    db_proyecto = get_proyecto_by_id(db, proyecto_id)
    if not db_proyecto:
        return None
    data = proyecto_update.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(db_proyecto, key, value)
    if actualizado_por_id is not None:
        from datetime import datetime
        db_proyecto.fecha_actualizacion = datetime.utcnow()
        db_proyecto.actualizado_por = actualizado_por_id
    db.commit()
    db.refresh(db_proyecto)
    return db_proyecto


def delete_proyecto(db: Session, proyecto_id: str) -> bool:
    db_proyecto = get_proyecto_by_id(db, proyecto_id)
    if not db_proyecto:
        return False
    db.delete(db_proyecto)
    db.commit()
    return True
