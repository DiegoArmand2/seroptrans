from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


class RolBase(BaseModel):
    nombre: str = Field(..., max_length=60)
    descripcion: Optional[str] = Field(None, max_length=200)


class RolCreate(RolBase):
    pass


class RolUpdate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=60)
    descripcion: Optional[str] = Field(None, max_length=200)


class RolResponse(RolBase):
    rol_id: str
    fecha_creacion: Optional[datetime] = None
    creado_por: Optional[str] = None
    creado_por_nombre: Optional[str] = None
    fecha_actualizacion: Optional[datetime] = None
    actualizado_por: Optional[str] = None
    actualizado_por_nombre: Optional[str] = None

    class Config:
        from_attributes = True


class RolUsuarioAssign(BaseModel):
    usuario_id: str
    rol_id: str


class RolPermisoVentanaBase(BaseModel):
    ventana: str = Field(..., max_length=100)


class RolPermisoVentanaCreate(RolPermisoVentanaBase):
    rol_id: str


class RolPermisoVentanaAdd(BaseModel):
    ventana: str = Field(..., max_length=100)


class RolPermisoVentanaResponse(RolPermisoVentanaBase):
    rolwin_id: str
    rol_id: str

    class Config:
        from_attributes = True


class RolPermisoProcesoBase(BaseModel):
    proceso: str = Field(..., max_length=100)


class RolPermisoProcesoCreate(RolPermisoProcesoBase):
    rol_id: str


class RolPermisoProcesoAdd(BaseModel):
    proceso: str = Field(..., max_length=100)


class RolPermisoProcesoResponse(RolPermisoProcesoBase):
    rolpro_id: str
    rol_id: str

    class Config:
        from_attributes = True


class RolPermisoProyectoAdd(BaseModel):
    proyecto_id: str


class RolPermisoProyectoResponse(BaseModel):
    rolproy_id: str
    rol_id: str
    proyecto_id: str

    class Config:
        from_attributes = True
