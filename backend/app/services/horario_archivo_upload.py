import re
import uuid
from pathlib import Path

from fastapi import Request, UploadFile

MAX_BYTES = 20 * 1024 * 1024
ALLOWED_SUFFIX = {".xlsx", ".xls"}
STORED_NAME_RE = re.compile(r"^[a-f0-9]{32}\.(xlsx|xls)$", re.IGNORECASE)


def _backend_root() -> Path:
    return Path(__file__).resolve().parent.parent.parent


def get_horarios_upload_dir() -> Path:
    from app.core.config import settings

    custom = (settings.HORARIOS_UPLOAD_DIR or "").strip()
    if custom:
        d = Path(custom)
    else:
        d = _backend_root() / "uploads" / "horarios"
    d.mkdir(parents=True, exist_ok=True)
    return d


def is_allowed_stored_name(stored_name: str) -> bool:
    return bool(STORED_NAME_RE.match(stored_name or ""))


def build_public_horario_file_url(request: Request, public_base_url: str, stored_name: str) -> str:
    base = (public_base_url or "").strip().rstrip("/")
    if not base:
        base = str(request.base_url).rstrip("/")
    return f"{base}/api/horarios/archivo/{stored_name}"


async def save_horario_upload(file: UploadFile) -> str:
    raw = file.filename or ""
    ext = Path(raw).suffix.lower()
    if ext not in ALLOWED_SUFFIX:
        raise ValueError("Solo se permiten archivos .xls o .xlsx")

    stored = f"{uuid.uuid4().hex}{ext}"
    dest = get_horarios_upload_dir() / stored
    total = 0
    try:
        with dest.open("wb") as out:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                total += len(chunk)
                if total > MAX_BYTES:
                    raise ValueError("Archivo demasiado grande (máximo 20 MB)")
                out.write(chunk)
        if total == 0:
            raise ValueError("Archivo vacío")
    except ValueError:
        dest.unlink(missing_ok=True)
        raise
    finally:
        await file.close()

    return stored
