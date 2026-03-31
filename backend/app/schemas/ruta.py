import json
from datetime import datetime
from decimal import Decimal
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator


def _validate_geocerca_value(v: Optional[str]) -> Optional[str]:
    if v is None or (isinstance(v, str) and not v.strip()):
        return None
    t = v.strip()
    try:
        parsed: Any = json.loads(t)
    except json.JSONDecodeError:
        raise ValueError("Geocerca: JSON inválido")
    if not isinstance(parsed, dict) or parsed.get("type") != "Feature" or "geometry" not in parsed:
        raise ValueError("Geocerca: debe ser un GeoJSON Feature con geometría")
    g = parsed.get("geometry")
    if not isinstance(g, dict) or g.get("type") not in ("Polygon", "MultiPolygon"):
        raise ValueError("Geocerca: la geometría debe ser Polygon o MultiPolygon")
    coords = g.get("coordinates")
    if not isinstance(coords, list) or len(coords) == 0:
        raise ValueError("Geocerca: coordenadas vacías")
    if g.get("type") == "Polygon":
        for ring in coords:
            if not isinstance(ring, list) or len(ring) < 4:
                raise ValueError("Geocerca: anillo de polígono inválido")
    else:
        for poly in coords:
            if not isinstance(poly, list):
                raise ValueError("Geocerca: MultiPolygon inválido")
            for ring in poly:
                if not isinstance(ring, list) or len(ring) < 4:
                    raise ValueError("Geocerca: anillo de polígono inválido")
    return json.dumps(parsed, separators=(",", ":"))


class RutaBase(BaseModel):
    proyecto_id: str
    nombre: str = Field(..., max_length=100)
    sector: Optional[str] = Field(None, max_length=100)
    geocerca: Optional[str] = None
    costo_base: Optional[Decimal] = None
    tipo: str = Field(default="diurna", max_length=20)
    activo: bool = True


class RutaCreate(RutaBase):
    @field_validator("geocerca")
    @classmethod
    def validate_geocerca(cls, v: Optional[str]) -> Optional[str]:
        return _validate_geocerca_value(v)


class RutaUpdate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=100)
    sector: Optional[str] = Field(None, max_length=100)
    geocerca: Optional[str] = None
    costo_base: Optional[Decimal] = None
    tipo: Optional[str] = Field(None, max_length=20)
    activo: Optional[bool] = None

    @field_validator("geocerca")
    @classmethod
    def validate_geocerca(cls, v: Optional[str]) -> Optional[str]:
        return _validate_geocerca_value(v)


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
