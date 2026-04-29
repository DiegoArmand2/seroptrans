from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_required
from app.models.usuario import Usuario
from app.schemas.demanda_viaje import DemandaViajeResponse
from app.services.demanda_viaje_service import get_demanda_viajes
from app.services.permisos_service import get_user_proyectos

router = APIRouter()


def _to_response(obj) -> DemandaViajeResponse:
    t = obj.turno
    p = obj.pasajero
    return DemandaViajeResponse(
        demanda_viaje_id=obj.demanda_viaje_id,
        turno_id=obj.turno_id,
        turno_nombre=t.nombre if t else None,
        proyecto_id=t.proyecto_id if t else None,
        horario_importacion_id=obj.horario_importacion_id,
        pasajero_id=obj.pasajero_id,
        pasajero_nombre=p.nombre if p else None,
        dia=obj.dia,
        sector=obj.sector,
        hora_ini=obj.hora_ini,
        min_ini=obj.min_ini,
        hora_fin=obj.hora_fin,
        min_fin=obj.min_fin,
        dia_fin=obj.dia_fin,
        cedula=obj.cedula,
        nombre=obj.nombre,
        fecha=obj.fecha,
        anio=obj.anio,
        numero_semana=obj.numero_semana,
        tipo=obj.tipo,
        dia_numero=obj.dia_numero,
    )


@router.get("", response_model=List[DemandaViajeResponse])
def list_demanda_viajes(
    proyecto_id: Optional[str] = None,
    horario_importacion_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    allowed = get_user_proyectos(db, current_user.usuario_id)
    items = get_demanda_viajes(
        db,
        proyecto_id=proyecto_id,
        horario_importacion_id=horario_importacion_id,
        allowed_proyecto_ids=allowed,
        skip=skip,
        limit=limit,
    )
    return [_to_response(x) for x in items]
