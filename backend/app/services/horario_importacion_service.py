import json
from typing import Any, List, Optional, Tuple

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.horario_importacion import HorarioImportacion

ESTADO_BORRADOR = "DR"
ESTADO_CONFIRMADO = "CO"
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


def call_n8n_horarios_webhook(
    webhook_url: str,
    *,
    proyecto_id: str,
    file_url: str,
    horario_id: str,
    anio: int,
    semana: int,
) -> Tuple[Any, Optional[str]]:
    """POST al webhook n8n con cuerpo JSON ampliado para trazabilidad."""
    try:
        n8n_timeout = float(settings.N8N_WEBHOOK_TIMEOUT_SECONDS)
        with httpx.Client(timeout=n8n_timeout) as client:
            r = client.post(
                webhook_url,
                json={
                    "id_proyecto": proyecto_id,
                    "url": file_url,
                    "horario_id": horario_id,
                    "anio": anio,
                    "semana": semana,
                },
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


def call_n8n_routes1of3_webhook(
    webhook_url: str,
    *,
    proyecto_id: str,
    horario_id: str,
) -> Tuple[Any, Optional[str]]:
    """POST al webhook n8n para procesar horarios (routes1of3)."""
    try:
        n8n_timeout = float(settings.N8N_WEBHOOK_TIMEOUT_SECONDS)
        with httpx.Client(timeout=n8n_timeout) as client:
            r = client.post(
                webhook_url,
                json={
                    "id_proyecto": proyecto_id,
                    "horario_id": horario_id,
                },
                headers={"Content-Type": "application/json"},
            )
    except httpx.RequestError as e:
        return None, f"Error de red al contactar el servicio de procesamiento: {e}"

    text = r.text
    try:
        body = r.json()
    except json.JSONDecodeError:
        if r.is_success:
            return None, f"Respuesta no JSON del servicio (HTTP {r.status_code})"
        return None, text[:2000] if text else f"HTTP {r.status_code}"

    return body, None


def create_importacion(
    db: Session,
    payload: HorariosImportarRequest,
    usuario_id: str,
) -> HorarioImportacion:
    """
    Crea la importación en BD antes de llamar a n8n.
    Se actualiza luego con el resultado (o error de transporte).
    """
    row = HorarioImportacion(
        proyecto_id=payload.proyecto_id,
        anio=payload.anio,
        numero_semana=payload.numero_semana,
        url_archivo=payload.url,
        creado_por=usuario_id,
        actualizado_por=usuario_id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def update_importacion_result(
    db: Session,
    row: HorarioImportacion,
    usuario_id: str,
    *,
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

    row.respuesta_msg = msg
    row.respuesta_code = code
    row.respuesta_title = title
    row.respuesta_raw = raw_str
    row.actualizado_por = usuario_id
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def persist_importacion(
    db: Session,
    payload: HorariosImportarRequest,
    usuario_id: str,
    n8n_body: Any = None,
    transport_error: Optional[str] = None,
) -> HorarioImportacion:
    """
    API previa: crea y completa en una sola llamada.
    Se mantiene por compatibilidad interna.
    """
    row = create_importacion(db, payload, usuario_id)
    return update_importacion_result(db, row, usuario_id, n8n_body=n8n_body, transport_error=transport_error)


def get_importacion_by_id(db: Session, horario_importacion_id: str) -> Optional[HorarioImportacion]:
    return (
        db.query(HorarioImportacion)
        .filter(HorarioImportacion.horario_importacion_id == horario_importacion_id)
        .first()
    )


def update_importacion_datos(
    db: Session,
    row: HorarioImportacion,
    *,
    anio: int,
    numero_semana: int,
    url_archivo: str,
    usuario_id: str,
) -> HorarioImportacion:
    if (row.estado or ESTADO_BORRADOR) == ESTADO_CONFIRMADO:
        raise ValueError("No se puede editar un horario confirmado")
    row.anio = anio
    row.numero_semana = numero_semana
    row.url_archivo = url_archivo
    row.actualizado_por = usuario_id
    from datetime import datetime
    row.fecha_actualizacion = datetime.utcnow()
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def delete_importacion(db: Session, horario_importacion_id: str) -> bool:
    row = get_importacion_by_id(db, horario_importacion_id)
    if not row:
        return False
    if (row.estado or ESTADO_BORRADOR) == ESTADO_CONFIRMADO:
        return False
    db.delete(row)
    db.commit()
    return True


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


def exists_otro_confirmado_misma_semana(
    db: Session,
    *,
    proyecto_id: str,
    anio: int,
    numero_semana: int,
    exclude_horario_importacion_id: str,
) -> bool:
    q = (
        db.query(HorarioImportacion)
        .filter(HorarioImportacion.proyecto_id == proyecto_id)
        .filter(HorarioImportacion.anio == anio)
        .filter(HorarioImportacion.numero_semana == numero_semana)
        .filter(HorarioImportacion.estado == ESTADO_CONFIRMADO)
        .filter(HorarioImportacion.horario_importacion_id != exclude_horario_importacion_id)
    )
    return q.first() is not None


def confirmar_importacion(db: Session, row: HorarioImportacion, usuario_id: str) -> HorarioImportacion:
    if (row.estado or ESTADO_BORRADOR) == ESTADO_CONFIRMADO:
        return row
    if exists_otro_confirmado_misma_semana(
        db,
        proyecto_id=row.proyecto_id,
        anio=row.anio,
        numero_semana=row.numero_semana,
        exclude_horario_importacion_id=row.horario_importacion_id,
    ):
        raise ValueError(
            f"No se puede confirmar un horario para la semana {row.numero_semana}: ya existe un horario confirmado."
        )
    row.estado = ESTADO_CONFIRMADO
    row.actualizado_por = usuario_id
    from datetime import datetime

    row.fecha_actualizacion = datetime.utcnow()
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
