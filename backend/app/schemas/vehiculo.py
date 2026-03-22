from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class VehiculoBase(BaseModel):
    placa: str = Field(..., max_length=20)
    capacidad: int = Field(default=16, ge=1, le=100)
    conductor_id: Optional[str] = None
    turno_id: str = Field(...)
    proyecto_id: str = Field(...)
    activo: bool = True


class VehiculoCreate(VehiculoBase):
    pass


class VehiculoUpdate(BaseModel):
    placa: Optional[str] = Field(None, max_length=20)
    capacidad: Optional[int] = Field(None, ge=1, le=100)
    conductor_id: Optional[str] = None
    turno_id: Optional[str] = None
    activo: Optional[bool] = None


class VehiculoResponse(VehiculoBase):
    vehiculo_id: str
    conductor_nombre: Optional[str] = None
    turno_nombre: Optional[str] = None
    fecha_creacion: Optional[datetime] = None
    creado_por: Optional[str] = None
    creado_por_nombre: Optional[str] = None
    fecha_actualizacion: Optional[datetime] = None
    actualizado_por: Optional[str] = None
    actualizado_por_nombre: Optional[str] = None

    class Config:
        from_attributes = True
