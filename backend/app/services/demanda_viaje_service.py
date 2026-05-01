from typing import List, Optional

from sqlalchemy.orm import Query, Session, joinedload

from app.models.demanda_viaje import DemandaViaje
from app.models.turno import Turno

MAX_DEMANDA_VIAJES_LIMIT = 5000


def _filtered_demanda_query(
    db: Session,
    proyecto_id: Optional[str] = None,
    horario_importacion_id: Optional[str] = None,
    allowed_proyecto_ids: Optional[List[str]] = None,
) -> Optional[Query]:
    if allowed_proyecto_ids is not None and len(allowed_proyecto_ids) == 0:
        return None
    q = db.query(DemandaViaje).join(Turno)
    if allowed_proyecto_ids is not None:
        q = q.filter(Turno.proyecto_id.in_(allowed_proyecto_ids))
    if proyecto_id:
        q = q.filter(Turno.proyecto_id == proyecto_id)
    if horario_importacion_id:
        q = q.filter(DemandaViaje.horario_importacion_id == horario_importacion_id)
    return q


def count_demanda_viajes(
    db: Session,
    proyecto_id: Optional[str] = None,
    horario_importacion_id: Optional[str] = None,
    allowed_proyecto_ids: Optional[List[str]] = None,
) -> int:
    q = _filtered_demanda_query(
        db,
        proyecto_id=proyecto_id,
        horario_importacion_id=horario_importacion_id,
        allowed_proyecto_ids=allowed_proyecto_ids,
    )
    if q is None:
        return 0
    return q.count()


def get_demanda_viajes(
    db: Session,
    proyecto_id: Optional[str] = None,
    horario_importacion_id: Optional[str] = None,
    allowed_proyecto_ids: Optional[List[str]] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[DemandaViaje]:
    q = _filtered_demanda_query(
        db,
        proyecto_id=proyecto_id,
        horario_importacion_id=horario_importacion_id,
        allowed_proyecto_ids=allowed_proyecto_ids,
    )
    if q is None:
        return []
    cap = min(max(limit, 1), MAX_DEMANDA_VIAJES_LIMIT)
    return (
        q.options(
            joinedload(DemandaViaje.turno),
            joinedload(DemandaViaje.pasajero),
        )
        .order_by(DemandaViaje.fecha.desc(), DemandaViaje.demanda_viaje_id.desc())
        .offset(skip)
        .limit(cap)
        .all()
    )
