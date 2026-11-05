import json
from typing import Any, Optional, Tuple

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import (
    DEFAULT_N8N_ASIGNAR_PLACA_WEBHOOK_URL,
    settings,
)
from app.core.database import get_db
from app.core.security import get_current_user_required
from app.models.usuario import Usuario
from app.schemas.asignacion_manual_ruta import (
    AsignacionManualRutaRequest,
    AsignacionManualRutaResponse,
)
from app.services.permisos_service import has_ventana

router = APIRouter()


def _normalize_n8n_payload(body: Any) -> Tuple[Optional[str], Optional[Any], Optional[str]]:
    if body is None:
        return None, None, None
    if isinstance(body, dict):
        msg = body.get("msg") or body.get("message") or body.get("mensaje")
        code = body.get("code")
        title = body.get("title") or body.get("titulo")
        if msg is not None:
            msg = str(msg)
        if title is not None:
            title = str(title)
        return msg, code, title
    if isinstance(body, str) and body.strip():
        return body.strip()[:2000], None, None
    return None, None, None


def call_n8n_asignar_placa_webhook(
    webhook_url: str,
    *,
    demanda_viaje_placa_id: str,
    placa: str,
    usuario_id: str,
    usuario_nombre: str,
) -> Tuple[Any, Optional[str]]:
    try:
        n8n_timeout = float(settings.N8N_WEBHOOK_TIMEOUT_SECONDS)
        with httpx.Client(timeout=n8n_timeout) as client:
            r = client.post(
                webhook_url,
                json={
                    "demanda_viaje_placa_id": demanda_viaje_placa_id,
                    "placa": placa,
                    "usuario_id": usuario_id,
                    "usuario_nombre": usuario_nombre,
                },
                headers={"Content-Type": "application/json"},
            )
    except httpx.RequestError as e:
        return None, f"Error de red al contactar el servicio de asignación: {e}"

    text = r.text
    try:
        body = r.json()
    except json.JSONDecodeError:
        if r.is_success:
            return {"ok": True, "msg": text[:500] if text else "OK"}, None
        return None, text[:2000] if text else f"HTTP {r.status_code}"

    if not r.is_success:
        msg, _code, title = _normalize_n8n_payload(body)
        detail = msg or title or text[:2000] or f"HTTP {r.status_code}"
        return None, detail

    return body, None


@router.post("", response_model=AsignacionManualRutaResponse)
def asignar_placa_manual(
    body: AsignacionManualRutaRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    if not has_ventana(db, current_user.usuario_id, "asignacion_manual_ruta"):
        raise HTTPException(status_code=403, detail="Sin permiso para asignación manual de ruta")

    demanda_id = (body.demanda_viaje_placa_id or "").strip()
    placa = (body.placa or "").strip()
    if not demanda_id or not placa:
        raise HTTPException(status_code=422, detail="ID de ruta y placa son obligatorios")

    webhook = (
        (settings.N8N_ASIGNAR_PLACA_WEBHOOK_URL or "").strip()
        or DEFAULT_N8N_ASIGNAR_PLACA_WEBHOOK_URL
    )
    n8n_body, transport_err = call_n8n_asignar_placa_webhook(
        webhook,
        demanda_viaje_placa_id=demanda_id,
        placa=placa,
        usuario_id=current_user.usuario_id,
        usuario_nombre=current_user.nombre_usuario or current_user.login or "",
    )
    if transport_err:
        raise HTTPException(status_code=503, detail=transport_err)

    msg, _code, title = _normalize_n8n_payload(n8n_body)
    mensaje = msg or title or "Asignación solicitada"
    return AsignacionManualRutaResponse(ok=True, mensaje=mensaje)
