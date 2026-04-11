import json
from typing import Any, List, Optional, Tuple

import httpx
from sqlalchemy.orm import Session

from app.models.horario_importacion import HorarioImportacion
from app.schemas.horario_importacion import HorariosImportarRequest


def _normalize_n8n_payload(data: Any) -> Tuple[Optional[str], Optional[int], Optional[str]]:
    if not isinstance(data, dict):
        return None, None, None
    msg = data.get("msg")
    title = data.get("title")
    code = data.get("code")
    if code is not None and not isinstance(code, int):
        try:
            code = int(code)
        except (TypeError, ValueError):
            code = None
    if msg is not None:
        msg = str(msg)
    if title is not None:
        title = str(title)
    return msg, code, title


def call_n8n_horarios_webhook(webhook_url: str, proyecto_id: str, file_url: str) -> Tuple[Any, Optional[str]]:
    """POST al webhook n8n con cuerpo: {\"id_proyecto\": uuid32, \"url\": url del archivo}."""
    try:
        with httpx.Client(timeout=120.0) as client:
            r = client.post(
                webhook_url,
                json={"id_proyecto": proyecto_id, "url": file_url},
                headers={"Content-Type": "application/json"},
            )
    except httpx.RequestError as e:
        return None, f"Error de red al contactar el servicio de horarios: {e}"

    text = r.text
    try:
        body = r.json()
    except json.JSONDecodeError:
        if r.is_success:
            return None, f"Respuesta no JSON del servicio (HTTP {r.status_code})"
        return None, text[:2000] if text else f"HTTP {r.status_code}"

    return body, None


def persist_importacion(
    db: Session,
    payload: HorariosImportarRequest,
    usuario_id: str,
    n8n_body: Any = None,
    transport_error: Optional[str] = None,
) -> HorarioImportacion:
    if transport_error:
        msg, code, title = transport_error, None, "Error de servicio"
        raw_str = None
    else:
        msg, code, title = _normalize_n8n_payload(n8n_body)
        raw_str = None
        if n8n_body is not None:
            try:
                raw_str = json.dumps(n8n_body, ensure_ascii=False)
            except (TypeError, ValueError):
                raw_str = str(n8n_body)[:8000]

    row = HorarioImportacion(
        proyecto_id=payload.proyecto_id,
        fecha_referencia=payload.fecha,
        url_archivo=payload.url,
        respuesta_msg=msg,
        respuesta_code=code,
        respuesta_title=title,
        respuesta_raw=raw_str,
        creado_por=usuario_id,
        actualizado_por=usuario_id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def list_importaciones(
    db: Session,
    proyecto_id: Optional[str] = None,
    allowed_proyecto_ids: Optional[List[str]] = None,
    limit: int = 100,
) -> List[HorarioImportacion]:
    """
    Lista importaciones. Si proyecto_id está definido, solo ese proyecto.
    Si no, filtra por allowed_proyecto_ids (lista vacía = ninguno; None = administrador, sin filtro).
    """
    q = db.query(HorarioImportacion)
    if proyecto_id:
        q = q.filter(HorarioImportacion.proyecto_id == proyecto_id)
    elif allowed_proyecto_ids is not None:
        if not allowed_proyecto_ids:
            return []
        q = q.filter(HorarioImportacion.proyecto_id.in_(allowed_proyecto_ids))
    cap = min(max(limit, 1), 200)
    return q.order_by(HorarioImportacion.fecha_creacion.desc()).limit(cap).all()
