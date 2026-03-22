from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


class ConductorBase(BaseModel):
    """Conductor (persona/chofer)."""
    nombre: str = Field(..., max_length=100)
    disponible: bool = True
    activo: bool = True


class ConductorCreate(ConductorBase):
    pass


class ConductorUpdate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=100)
    disponible: Optional[bool] = None
    activo: Optional[bool] = None


class ConductorResponse(ConductorBase):
    conductor_id: str
    proyecto_nombres: Optional[List[str]] = None
    proyecto_ids: Optional[List[str]] = None
    fecha_creacion: Optional[datetime] = None
    creado_por: Optional[str] = None
    creado_por_nombre: Optional[str] = None
    fecha_actualizacion: Optional[datetime] = None
    actualizado_por: Optional[str] = None
    actualizado_por_nombre: Optional[str] = None

    class Config:
        from_attributes = True


class ConductorProyectoAssign(BaseModel):
    proyecto_id: str
    conductor_id: str


class ConductorRutaAssign(BaseModel):
    conductor_id: str
    ruta_id: str
    tipo: str  # diurna, nocturna
