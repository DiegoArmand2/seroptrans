from pydantic_settings import BaseSettings
from functools import lru_cache

# Webhook por defecto (importación horarios → n8n). Sobrescribible con N8N_HORARIOS_WEBHOOK_URL.
DEFAULT_N8N_HORARIOS_WEBHOOK_URL = "https://n8nadm.admagentes.online/webhook/st_horarios"
# Webhook por defecto (procesar horarios → n8n). Sobrescribible con N8N_ROUTES1OF3_WEBHOOK_URL.
DEFAULT_N8N_ROUTES1OF3_WEBHOOK_URL = "https://n8nadm.admagentes.online/webhook/routes1of3"


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./seroptrans.db"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    N8N_HORARIOS_WEBHOOK_URL: str = ""
    N8N_ROUTES1OF3_WEBHOOK_URL: str = ""
    # Base pública para URLs de archivos subidos (n8n debe poder alcanzarla). Vacío = usar host de la petición.
    PUBLIC_BASE_URL: str = ""
    # Orígenes CORS separados por coma. En Docker sin proxy, típicamente el frontend estará en :3000.
    CORS_ORIGINS: str = (
        "http://localhost:3000,http://127.0.0.1:3000,"
        "http://localhost:5173,http://127.0.0.1:5173"
    )
    # Ruta absoluta para uploads de horarios. En Docker usar /app/uploads/horarios (montado a volumen).
    # Vacío = usa backend/uploads/horarios relativo al repo.
    HORARIOS_UPLOAD_DIR: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()
