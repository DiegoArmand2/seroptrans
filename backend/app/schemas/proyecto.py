from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ProyectoBase(BaseModel):
    nombre: str = Field(..., max_length=100)
    descripcion: Optional[str] = Field(None, max_length=300)
    parametros_operativos: Optional[str] = None
    activo: bool = True


class ProyectoCreate(ProyectoBase):
    pass


class ProyectoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=100)
    descripcion: Optional[str] = Field(None, max_length=300)
    parametros_operativos: Optional[str] = None
    activo: Optional[bool] = None


class ProyectoResponse(ProyectoBase):
    proyecto_id: str
    fecha_creacion: Optional[datetime] = None
    creado_por: Optional[str] = None
    creado_por_nombre: Optional[str] = None
    fecha_actualizacion: Optional[datetime] = None
    actualizado_por: Optional[str] = None
    actualizado_por_nombre: Optional[str] = None

    class Config:
        from_attributes = True
