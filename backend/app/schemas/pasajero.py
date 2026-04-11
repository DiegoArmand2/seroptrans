from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class PasajeroBase(BaseModel):
    proyecto_id: str
    cedula: str = Field(..., max_length=20)
    nombre: str = Field(..., max_length=100)
    direccion: Optional[str] = Field(None, max_length=300)
    lat: Optional[Decimal] = None
    lng: Optional[Decimal] = None
    ruta_id: Optional[str] = None
    tipo_pasajero_id: Optional[str] = None
    horario_habitual: Optional[str] = Field(None, max_length=50)
    placa_asignada: Optional[str] = Field(None, max_length=20)
    activo: bool = True


class PasajeroCreate(PasajeroBase):
    contrasena: Optional[str] = Field(None, max_length=128)

    @field_validator("lat", mode="after")
    @classmethod
    def validate_lat(cls, v):
        if v is None:
            return v
        x = float(v)
        if x < -90 or x > 90:
            raise ValueError("La latitud debe estar entre -90 y 90")
        return v

    @field_validator("lng", mode="after")
    @classmethod
    def validate_lng(cls, v):
        if v is None:
            return v
        x = float(v)
        if x < -180 or x > 180:
            raise ValueError("La longitud debe estar entre -180 y 180")
        return v


class PasajeroUpdate(BaseModel):
    cedula: Optional[str] = Field(None, max_length=20)
    nombre: Optional[str] = Field(None, max_length=100)
    direccion: Optional[str] = Field(None, max_length=300)
    lat: Optional[Decimal] = None
    lng: Optional[Decimal] = None
    ruta_id: Optional[str] = None
    tipo_pasajero_id: Optional[str] = None
    horario_habitual: Optional[str] = Field(None, max_length=50)
    placa_asignada: Optional[str] = Field(None, max_length=20)
    activo: Optional[bool] = None
    contrasena: Optional[str] = Field(None, max_length=128)

    @field_validator("lat", mode="after")
    @classmethod
    def validate_lat_upd(cls, v):
        if v is None:
            return v
        x = float(v)
        if x < -90 or x > 90:
            raise ValueError("La latitud debe estar entre -90 y 90")
        return v

    @field_validator("lng", mode="after")
    @classmethod
    def validate_lng_upd(cls, v):
        if v is None:
            return v
        x = float(v)
        if x < -180 or x > 180:
            raise ValueError("La longitud debe estar entre -180 y 180")
        return v


class PasajeroResponse(PasajeroBase):
    pasajero_id: str
    tiene_contrasena: bool = False
    fecha_creacion: Optional[datetime] = None
    creado_por: Optional[str] = None
    creado_por_nombre: Optional[str] = None
    fecha_actualizacion: Optional[datetime] = None
    actualizado_por: Optional[str] = None
    actualizado_por_nombre: Optional[str] = None

    class Config:
        from_attributes = True
