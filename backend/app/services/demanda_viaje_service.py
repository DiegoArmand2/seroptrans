from typing import List, Optional

from sqlalchemy.orm import Session, joinedload

from app.models.demanda_viaje import DemandaViaje
from app.models.turno import Turno


def get_demanda_viajes(
    db: Session,
    proyecto_id: Optional[str] = None,
    horario_importacion_id: Optional[str] = None,
    allowed_proyecto_ids: Optional[List[str]] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[DemandaViaje]:
    if allowed_proyecto_ids is not None and len(allowed_proyecto_ids) == 0:
        return []
    q = db.query(DemandaViaje).join(Turno).options(
        joinedload(DemandaViaje.turno),
        joinedload(DemandaViaje.pasajero),
    )
    if allowed_proyecto_ids is not None:
        q = q.filter(Turno.proyecto_id.in_(allowed_proyecto_ids))
    if proyecto_id:
        q = q.filter(Turno.proyecto_id == proyecto_id)
    if horario_importacion_id:
        q = q.filter(DemandaViaje.horario_importacion_id == horario_importacion_id)
    cap = min(max(limit, 1), 200)
    return q.order_by(DemandaViaje.fecha.desc(), DemandaViaje.demanda_viaje_id.desc()).offset(skip).limit(cap).all()
