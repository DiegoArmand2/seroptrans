from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DemandaViajeResponse(BaseModel):
    demanda_viaje_id: str
    turno_id: str
    turno_nombre: Optional[str] = None
    proyecto_id: Optional[str] = None
    horario_importacion_id: Optional[str] = None
    pasajero_id: Optional[str] = None
    pasajero_nombre: Optional[str] = None
    dia: str
    sector: str
    hora_ini: int
    min_ini: int
    hora_fin: int
    min_fin: int
    dia_fin: str
    cedula: str
    nombre: str
    fecha: Optional[datetime] = None
    anio: Optional[int] = None
    numero_semana: Optional[int] = None
    tipo: Optional[str] = None
    dia_numero: Optional[int] = None

    class Config:
        from_attributes = True
