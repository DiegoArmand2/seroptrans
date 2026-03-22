from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import Optional, List

from pydantic import BaseModel, Field, field_validator


class UsuarioBase(BaseModel):
    login: str = Field(..., max_length=30)
    nombre_usuario: str = Field(..., max_length=60)
    email: Optional[str] = Field(None, max_length=60)
    telefono: Optional[Decimal] = None
    direccion: Optional[str] = Field(None, max_length=200)

    @field_validator("email", "direccion", mode="before")
    @classmethod
    def empty_str_to_none(cls, v):
        return None if (v is not None and str(v).strip() == "") else v

    @field_validator("telefono", mode="before")
    @classmethod
    def parse_telefono(cls, v):
        if v is None or (isinstance(v, str) and v.strip() == ""):
            return None
        if isinstance(v, str):
            try:
                return Decimal(v.strip())
            except (InvalidOperation, ValueError):
                return None
        return v


class UsuarioCreate(UsuarioBase):
    password: str = Field(..., min_length=6)


class UsuarioUpdate(BaseModel):
    nombre_usuario: Optional[str] = Field(None, max_length=60)
    email: Optional[str] = Field(None, max_length=60)
    telefono: Optional[Decimal] = None
    direccion: Optional[str] = Field(None, max_length=200)
    password: Optional[str] = Field(None, min_length=6)

    @field_validator("email", "direccion", mode="before")
    @classmethod
    def empty_str_to_none(cls, v):
        return None if (v is not None and str(v).strip() == "") else v

    @field_validator("telefono", mode="before")
    @classmethod
    def parse_telefono(cls, v):
        if v is None or (isinstance(v, str) and v.strip() == ""):
            return None
        if isinstance(v, str):
            try:
                return Decimal(v.strip())
            except (InvalidOperation, ValueError):
                return None
        return v


class RolAsignado(BaseModel):
    rol_id: str
    nombre: str


class UsuarioResponse(UsuarioBase):
    usuario_id: str
    fecha_creacion: Optional[datetime] = None
    creado_por: Optional[str] = None
    creado_por_nombre: Optional[str] = None
    fecha_actualizacion: Optional[datetime] = None
    actualizado_por: Optional[str] = None
    actualizado_por_nombre: Optional[str] = None
    roles: List[RolAsignado] = []

    class Config:
        from_attributes = True


class UsuarioConRoles(UsuarioResponse):
    pass


class UsuarioList(BaseModel):
    usuario_id: str
    login: str
    nombre_usuario: str
    email: Optional[str] = None
    roles: List[str] = []

    class Config:
        from_attributes = True


class RolIdsSync(BaseModel):
    rol_ids: List[str] = []
