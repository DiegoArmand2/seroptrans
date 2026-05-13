from datetime import datetime, time
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field, field_validator


TipoTurno = Literal["matutino", "nocturno", "ambos"]
TipoHorario = Literal["entrada", "salida", "ambos"]
PuntoInicioTurno = Literal["domicilio", "punto_encuentro"]


class TurnoBase(BaseModel):
    proyecto_id: str
    codigo: Optional[str] = Field(None, max_length=20)
    punto_inicio: PuntoInicioTurno = "domicilio"
    nombre: str = Field(..., max_length=60)
    descripcion: Optional[str] = Field(None, max_length=200)
    activo: bool = True
    hora_entrada: Optional[time] = None
    hora_salida: Optional[time] = None
    tipo_turno: TipoTurno = "matutino"
    tipo_horario: TipoHorario = "entrada"
    cambio_dia: bool = False

    @field_validator("codigo", mode="before")
    @classmethod
    def normalize_codigo(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        if isinstance(v, str):
            s = v.strip()
            return s if s else None
        return v


class TurnoCreate(TurnoBase):
    pass


class TurnoUpdate(BaseModel):
    codigo: Optional[str] = Field(None, max_length=20)
    punto_inicio: Optional[PuntoInicioTurno] = None
    nombre: Optional[str] = Field(None, max_length=60)
    descripcion: Optional[str] = Field(None, max_length=200)
    activo: Optional[bool] = None
    hora_entrada: Optional[time] = None
    hora_salida: Optional[time] = None
    tipo_turno: Optional[TipoTurno] = None
    tipo_horario: Optional[TipoHorario] = None
    cambio_dia: Optional[bool] = None

    @field_validator("codigo", mode="before")
    @classmethod
    def normalize_codigo(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        if isinstance(v, str):
            s = v.strip()
            return s if s else None
        return v


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
