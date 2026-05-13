import json
from datetime import datetime
from decimal import Decimal
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field, field_validator


PuntoInicioRuta = Literal["domicilio", "punto_encuentro"]


def _is_lng_lat_pair(c: Any) -> bool:
    return (
        isinstance(c, list)
        and len(c) >= 2
        and isinstance(c[0], (int, float))
        and isinstance(c[1], (int, float))
    )


def _in_wgs84_range(lng: float, lat: float) -> bool:
    return -180 <= lng <= 180 and -90 <= lat <= 90


def _validate_position_chain(positions: Any, label: str) -> None:
    if not isinstance(positions, list) or len(positions) < 2:
        raise ValueError(f"Geocerca: {label} requiere al menos 2 posiciones")
    for p in positions:
        if not _is_lng_lat_pair(p):
            raise ValueError(f"Geocerca: {label} inválido")
        lng_f, lat_f = float(p[0]), float(p[1])
        if not _in_wgs84_range(lng_f, lat_f):
            raise ValueError("Geocerca: coordenadas fuera de rango WGS84")


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
    if not isinstance(g, dict):
        raise ValueError("Geocerca: geometría inválida")
    gt = g.get("type")
    if gt not in (
        "Polygon",
        "MultiPolygon",
        "Point",
        "MultiPoint",
        "LineString",
        "MultiLineString",
    ):
        raise ValueError(
            "Geocerca: la geometría debe ser Polygon, MultiPolygon, Point, MultiPoint, "
            "LineString o MultiLineString"
        )
    coords = g.get("coordinates")
    if not isinstance(coords, list) or len(coords) == 0:
        raise ValueError("Geocerca: coordenadas vacías")
    if gt == "Point":
        if not _is_lng_lat_pair(coords):
            raise ValueError("Geocerca: Point inválido")
        lng_f, lat_f = float(coords[0]), float(coords[1])
        if not _in_wgs84_range(lng_f, lat_f):
            raise ValueError("Geocerca: coordenadas fuera de rango WGS84")
    elif gt == "MultiPoint":
        for p in coords:
            if not _is_lng_lat_pair(p):
                raise ValueError("Geocerca: MultiPoint inválido")
            lng_f, lat_f = float(p[0]), float(p[1])
            if not _in_wgs84_range(lng_f, lat_f):
                raise ValueError("Geocerca: coordenadas fuera de rango WGS84")
    elif gt == "LineString":
        _validate_position_chain(coords, "LineString")
    elif gt == "MultiLineString":
        for line in coords:
            _validate_position_chain(line, "MultiLineString")
    elif gt == "Polygon":
        for ring in coords:
            if not isinstance(ring, list) or len(ring) < 4:
                raise ValueError("Geocerca: anillo de polígono inválido")
    elif gt == "MultiPolygon":
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
    codigo: Optional[str] = Field(None, max_length=50)
    punto_inicio: PuntoInicioRuta = "domicilio"
    sector: Optional[str] = Field(None, max_length=100)
    geocerca: Optional[str] = None
    costo_base: Optional[Decimal] = None
    tipo: str = Field(default="diurna", max_length=20)
    activo: bool = True

    @field_validator("codigo", mode="before")
    @classmethod
    def normalize_codigo(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        if isinstance(v, str):
            s = v.strip()
            return s if s else None
        return v


class RutaCreate(RutaBase):
    @field_validator("geocerca")
    @classmethod
    def validate_geocerca(cls, v: Optional[str]) -> Optional[str]:
        return _validate_geocerca_value(v)


class RutaUpdate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=100)
    codigo: Optional[str] = Field(None, max_length=50)
    punto_inicio: Optional[PuntoInicioRuta] = None
    sector: Optional[str] = Field(None, max_length=100)
    geocerca: Optional[str] = None
    costo_base: Optional[Decimal] = None
    tipo: Optional[str] = Field(None, max_length=20)
    activo: Optional[bool] = None

    @field_validator("codigo", mode="before")
    @classmethod
    def normalize_codigo(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        if isinstance(v, str):
            s = v.strip()
            return s if s else None
        return v

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
