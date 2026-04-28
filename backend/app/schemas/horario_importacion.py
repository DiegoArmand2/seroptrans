from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, model_validator

from app.utils.iso_week import iso_weeks_in_iso_year


class HorariosImportarRequest(BaseModel):
    proyecto_id: str = Field(..., min_length=1, max_length=32)
    anio: int = Field(..., ge=1900, le=2100)
    numero_semana: int = Field(..., ge=1, le=53)
    url: str = Field(..., min_length=1, max_length=8000)

    @model_validator(mode="after")
    def validate_numero_semana_vs_anio(self):
        max_w = iso_weeks_in_iso_year(self.anio)
        if self.numero_semana > max_w:
            raise ValueError(f"numero_semana no puede ser mayor que {max_w} para el año {self.anio}")
        return self


class HorariosImportarResponse(BaseModel):
    msg: Optional[str] = None
    code: Optional[int] = None
    title: Optional[str] = None
    horario_importacion_id: str


class HorarioArchivoSubidoResponse(BaseModel):
    """URL absoluta para usar en n8n (descarga pública temporal por nombre opaco)."""

    url: str


class HorarioImportacionListItem(BaseModel):
    horario_importacion_id: str
    proyecto_id: str
    anio: int
    numero_semana: int
    url_archivo: str
    respuesta_msg: Optional[str] = None
    respuesta_code: Optional[int] = None
    respuesta_title: Optional[str] = None
    fecha_creacion: datetime

    class Config:
        from_attributes = True


class HorarioImportacionDetail(HorarioImportacionListItem):
    creado_por: Optional[str] = None
    fecha_actualizacion: Optional[datetime] = None
    actualizado_por: Optional[str] = None

    class Config:
        from_attributes = True


class HorarioImportacionUpdate(BaseModel):
    anio: int = Field(..., ge=1900, le=2100)
    numero_semana: int = Field(..., ge=1, le=53)
    url: str = Field(..., min_length=1, max_length=8000)

    @model_validator(mode="after")
    def validate_numero_semana_vs_anio(self):
        max_w = iso_weeks_in_iso_year(self.anio)
        if self.numero_semana > max_w:
            raise ValueError(f"numero_semana no puede ser mayor que {max_w} para el año {self.anio}")
        return self
