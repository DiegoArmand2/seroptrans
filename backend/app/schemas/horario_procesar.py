from pydantic import BaseModel


class HorarioProcesarResponse(BaseModel):
    ok: bool = True
    mensaje: str = "Procesamiento pendiente de implementación"
