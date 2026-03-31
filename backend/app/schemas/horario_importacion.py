from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class HorariosImportarRequest(BaseModel):
    proyecto_id: str = Field(..., min_length=1, max_length=32)
    fecha: date
    url: str = Field(..., min_length=1, max_length=8000)


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
    fecha_referencia: date
    url_archivo: str
    respuesta_msg: Optional[str] = None
    respuesta_code: Optional[int] = None
    respuesta_title: Optional[str] = None
    fecha_creacion: datetime

    class Config:
        from_attributes = True
