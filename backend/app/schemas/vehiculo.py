from datetime import datetime
from decimal import Decimal
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator


class VehiculoBase(BaseModel):
    placa: str = Field(..., max_length=20)
    capacidad: int = Field(default=16, ge=1, le=100)
    conductor_id: Optional[str] = None
    ruta_id: Optional[str] = None
    proyecto_id: str = Field(...)
    tipo_vehiculo_id: Optional[str] = None
    passwd: Optional[str] = Field(None, max_length=255)
    rating: Optional[Decimal] = None
    model: Optional[str] = Field(None, max_length=100)
    color: Optional[str] = Field(None, max_length=50)
    activo: bool = True

    @field_validator("passwd", "model", "color", mode="before")
    @classmethod
    def normalize_optional_str(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        if isinstance(v, str):
            s = v.strip()
            return s if s else None
        return v

    @field_validator("rating", mode="after")
    @classmethod
    def validate_rating(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is None:
            return v
        x = float(v)
        if x < 0 or x > 5:
            raise ValueError("El rating debe estar entre 0 y 5")
        return v


class VehiculoCreate(VehiculoBase):
    pass


class VehiculoUpdate(BaseModel):
    placa: Optional[str] = Field(None, max_length=20)
    capacidad: Optional[int] = Field(None, ge=1, le=100)
    conductor_id: Optional[str] = None
    ruta_id: Optional[str] = None
    tipo_vehiculo_id: Optional[str] = None
    passwd: Optional[str] = Field(None, max_length=255)
    rating: Optional[Decimal] = None
    model: Optional[str] = Field(None, max_length=100)
    color: Optional[str] = Field(None, max_length=50)
    activo: Optional[bool] = None

    @field_validator("passwd", "model", "color", mode="before")
    @classmethod
    def normalize_optional_str(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        if isinstance(v, str):
            s = v.strip()
            return s if s else None
        return v

    @field_validator("rating", mode="after")
    @classmethod
    def validate_rating(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is None:
            return v
        x = float(v)
        if x < 0 or x > 5:
            raise ValueError("El rating debe estar entre 0 y 5")
        return v


class VehiculoResponse(VehiculoBase):
    vehiculo_id: str
    conductor_nombre: Optional[str] = None
    ruta_nombre: Optional[str] = None
    tipo_vehiculo_nombre: Optional[str] = None
    fecha_creacion: Optional[datetime] = None
    creado_por: Optional[str] = None
    creado_por_nombre: Optional[str] = None
    fecha_actualizacion: Optional[datetime] = None
    actualizado_por: Optional[str] = None
    actualizado_por_nombre: Optional[str] = None

    class Config:
        from_attributes = True
