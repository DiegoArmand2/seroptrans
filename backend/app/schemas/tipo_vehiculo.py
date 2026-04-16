from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class TipoVehiculoBase(BaseModel):
    proyecto_id: str
    identificador: str = Field(..., max_length=30)
    nombre: str = Field(..., max_length=60)
    descripcion: Optional[str] = Field(None, max_length=200)
    activo: bool = True


class TipoVehiculoCreate(TipoVehiculoBase):
    pass


class TipoVehiculoUpdate(BaseModel):
    identificador: Optional[str] = Field(None, max_length=30)
    nombre: Optional[str] = Field(None, max_length=60)
    descripcion: Optional[str] = Field(None, max_length=200)
    activo: Optional[bool] = None


class TipoVehiculoResponse(TipoVehiculoBase):
    tipo_vehiculo_id: str
    fecha_creacion: Optional[datetime] = None
    creado_por: Optional[str] = None
    creado_por_nombre: Optional[str] = None
    fecha_actualizacion: Optional[datetime] = None
    actualizado_por: Optional[str] = None
    actualizado_por_nombre: Optional[str] = None

    class Config:
        from_attributes = True
