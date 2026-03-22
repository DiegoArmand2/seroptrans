from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class PasajeroBase(BaseModel):
    proyecto_id: str
    cedula: str = Field(..., max_length=20)
    nombre: str = Field(..., max_length=100)
    direccion: Optional[str] = Field(None, max_length=300)
    lat: Optional[Decimal] = None
    lng: Optional[Decimal] = None
    ruta_id: Optional[str] = None
    horario_habitual: Optional[str] = Field(None, max_length=50)
    placa_asignada: Optional[str] = Field(None, max_length=20)
    activo: bool = True


class PasajeroCreate(PasajeroBase):
    pass


class PasajeroUpdate(BaseModel):
    cedula: Optional[str] = Field(None, max_length=20)
    nombre: Optional[str] = Field(None, max_length=100)
    direccion: Optional[str] = Field(None, max_length=300)
    lat: Optional[Decimal] = None
    lng: Optional[Decimal] = None
    ruta_id: Optional[str] = None
    horario_habitual: Optional[str] = Field(None, max_length=50)
    placa_asignada: Optional[str] = Field(None, max_length=20)
    activo: Optional[bool] = None


class PasajeroResponse(PasajeroBase):
    pasajero_id: str
    fecha_creacion: Optional[datetime] = None
    creado_por: Optional[str] = None
    creado_por_nombre: Optional[str] = None
    fecha_actualizacion: Optional[datetime] = None
    actualizado_por: Optional[str] = None
    actualizado_por_nombre: Optional[str] = None

    class Config:
        from_attributes = True
