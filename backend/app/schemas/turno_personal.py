from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class TurnoPersonalBase(BaseModel):
    proyecto_id: str = Field(..., min_length=1, max_length=32)
    horario_importacion_id: str = Field(..., min_length=1, max_length=32)
    pasajero_id: Optional[str] = Field(default=None, min_length=1, max_length=32)

    empresa: Optional[str] = Field(default=None, max_length=100)
    proceso: Optional[str] = Field(default=None, max_length=100)
    cargo: Optional[str] = Field(default=None, max_length=100)
    rut: Optional[str] = Field(default=None, max_length=20)
    apellidos: Optional[str] = Field(default=None, max_length=100)
    funcionarios: Optional[str] = Field(default=None, max_length=100)
    dia_09: Optional[str] = Field(default=None, max_length=100)
    dia_10: Optional[str] = Field(default=None, max_length=100)
    dia_11: Optional[str] = Field(default=None, max_length=100)
    dia_12: Optional[str] = Field(default=None, max_length=100)
    dia_13: Optional[str] = Field(default=None, max_length=100)
    dia_14: Optional[str] = Field(default=None, max_length=100)
    dia_15: Optional[str] = Field(default=None, max_length=100)


class TurnoPersonalCreate(TurnoPersonalBase):
    pasajero_id: str = Field(..., min_length=1, max_length=32)


class TurnoPersonalUpdate(BaseModel):
    pasajero_id: Optional[str] = Field(default=None, min_length=1, max_length=32)
    empresa: Optional[str] = Field(default=None, max_length=100)
    proceso: Optional[str] = Field(default=None, max_length=100)
    cargo: Optional[str] = Field(default=None, max_length=100)
    rut: Optional[str] = Field(default=None, max_length=20)
    apellidos: Optional[str] = Field(default=None, max_length=100)
    funcionarios: Optional[str] = Field(default=None, max_length=100)
    dia_09: Optional[str] = Field(default=None, max_length=100)
    dia_10: Optional[str] = Field(default=None, max_length=100)
    dia_11: Optional[str] = Field(default=None, max_length=100)
    dia_12: Optional[str] = Field(default=None, max_length=100)
    dia_13: Optional[str] = Field(default=None, max_length=100)
    dia_14: Optional[str] = Field(default=None, max_length=100)
    dia_15: Optional[str] = Field(default=None, max_length=100)


class TurnoPersonalResponse(TurnoPersonalBase):
    turno_personal_id: str
    fecha_creacion: datetime
    creado_por: Optional[str] = None
    fecha_actualizacion: Optional[datetime] = None
    actualizado_por: Optional[str] = None

    creado_por_nombre: Optional[str] = None
    actualizado_por_nombre: Optional[str] = None

    class Config:
        from_attributes = True

