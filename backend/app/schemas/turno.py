from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class TurnoBase(BaseModel):
    proyecto_id: str
    nombre: str = Field(..., max_length=60)
    descripcion: Optional[str] = Field(None, max_length=200)
    activo: bool = True


class TurnoCreate(TurnoBase):
    pass


class TurnoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=60)
    descripcion: Optional[str] = Field(None, max_length=200)
    activo: Optional[bool] = None


class TurnoResponse(TurnoBase):
    turno_id: str
    fecha_creacion: Optional[datetime] = None
    creado_por: Optional[str] = None
    creado_por_nombre: Optional[str] = None
    fecha_actualizacion: Optional[datetime] = None
    actualizado_por: Optional[str] = None
    actualizado_por_nombre: Optional[str] = None

    class Config:
        from_attributes = True
