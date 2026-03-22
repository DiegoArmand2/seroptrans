from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class RutaBase(BaseModel):
    proyecto_id: str
    nombre: str = Field(..., max_length=100)
    sector: Optional[str] = Field(None, max_length=100)
    geocerca: Optional[str] = None
    costo_base: Optional[Decimal] = None
    tipo: str = Field(default="diurna", max_length=20)
    activo: bool = True


class RutaCreate(RutaBase):
    pass


class RutaUpdate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=100)
    sector: Optional[str] = Field(None, max_length=100)
    geocerca: Optional[str] = None
    costo_base: Optional[Decimal] = None
    tipo: Optional[str] = Field(None, max_length=20)
    activo: Optional[bool] = None


class RutaResponse(RutaBase):
    ruta_id: str
    fecha_creacion: Optional[datetime] = None
    creado_por: Optional[str] = None
    creado_por_nombre: Optional[str] = None
    fecha_actualizacion: Optional[datetime] = None
    actualizado_por: Optional[str] = None
    actualizado_por_nombre: Optional[str] = None

    class Config:
        from_attributes = True
