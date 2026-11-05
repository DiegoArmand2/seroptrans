from pydantic import BaseModel, Field


class AsignacionManualRutaRequest(BaseModel):
    """ID de ruta en UI → demanda_viaje_placa_id en el webhook n8n."""

    demanda_viaje_placa_id: str = Field(..., min_length=1, max_length=64)
    placa: str = Field(..., min_length=1, max_length=20)


class AsignacionManualRutaResponse(BaseModel):
    ok: bool = True
    mensaje: str = "Asignación solicitada"
