from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class TipoPasajeroBase(BaseModel):
    proyecto_id: str
    codigo: str = Field(..., max_length=30)
    nombre: str = Field(..., max_length=60)
    descripcion: Optional[str] = Field(None, max_length=200)
    activo: bool = True


class TipoPasajeroCreate(TipoPasajeroBase):
    pass


class TipoPasajeroUpdate(BaseModel):
    codigo: Optional[str] = Field(None, max_length=30)
    nombre: Optional[str] = Field(None, max_length=60)
    descripcion: Optional[str] = Field(None, max_length=200)
    activo: Optional[bool] = None


class TipoPasajeroResponse(TipoPasajeroBase):
    tipo_pasajero_id: str
    fecha_creacion: Optional[datetime] = None
    creado_por: Optional[str] = None
    creado_por_nombre: Optional[str] = None
    fecha_actualizacion: Optional[datetime] = None
    actualizado_por: Optional[str] = None
    actualizado_por_nombre: Optional[str] = None

    class Config:
        from_attributes = True
