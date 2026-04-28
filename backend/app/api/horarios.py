import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings, DEFAULT_N8N_HORARIOS_WEBHOOK_URL
from app.core.database import get_db
from app.core.security import get_current_user_required
from app.models.usuario import Usuario
from app.schemas.horario_importacion import (
    HorarioArchivoSubidoResponse,
    HorarioImportacionDetail,
    HorarioImportacionListItem,
    HorarioImportacionUpdate,
    HorariosImportarRequest,
    HorariosImportarResponse,
)
from app.services.horario_importacion_service import (
    call_n8n_horarios_webhook,
    list_importaciones,
    create_importacion,
    update_importacion_result,
    get_importacion_by_id,
    update_importacion_datos,
    delete_importacion,
    _normalize_n8n_payload,
)
from app.services.permisos_service import can_access_proyecto, get_user_proyectos
from app.services.proyecto_service import get_proyecto_by_id
from app.services.horario_archivo_upload import (
    build_public_horario_file_url,
    get_horarios_upload_dir,
    is_allowed_stored_name,
    save_horario_upload,
)

logger = logging.getLogger(__name__)
router = APIRouter()


def _media_type_por_sufijo(suffix: str) -> str:
    if suffix.lower() == ".xlsx":
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    return "application/vnd.ms-excel"


@router.get("/archivo/{stored_name}")
def descargar_archivo_horario(stored_name: str):
    """Descarga pública (sin JWT) para que n8n u otros consuman la URL guardada."""
    if not is_allowed_stored_name(stored_name):
        raise HTTPException(status_code=404, detail="No encontrado")
    path = get_horarios_upload_dir() / stored_name
    if not path.is_file():
        raise HTTPException(status_code=404, detail="No encontrado")
    suffix = path.suffix.lower()
    return FileResponse(
        path,
        filename=stored_name,
        media_type=_media_type_por_sufijo(suffix),
    )


@router.post("/subir-archivo", response_model=HorarioArchivoSubidoResponse)
async def subir_archivo_horario(
    request: Request,
    file: UploadFile = File(...),
    current_user: Usuario = Depends(get_current_user_required),
):
    try:
        stored = await save_horario_upload(file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    url = build_public_horario_file_url(request, settings.PUBLIC_BASE_URL, stored)
    logger.info("Horario Excel subido por %s → %s", current_user.usuario_id, stored)
    return HorarioArchivoSubidoResponse(url=url)


@router.post("/importar", response_model=HorariosImportarResponse)
def importar_horarios(
    body: HorariosImportarRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    if not get_proyecto_by_id(db, body.proyecto_id):
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    if not can_access_proyecto(db, current_user.usuario_id, body.proyecto_id):
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")

    webhook = (settings.N8N_HORARIOS_WEBHOOK_URL or "").strip() or DEFAULT_N8N_HORARIOS_WEBHOOK_URL

    row = create_importacion(db, body, current_user.usuario_id)

    n8n_body, transport_err = call_n8n_horarios_webhook(
        webhook,
        proyecto_id=body.proyecto_id,
        file_url=body.url,
        horario_id=row.horario_importacion_id,
        anio=body.anio,
        semana=body.numero_semana,
    )

    if transport_err:
        update_importacion_result(db, row, current_user.usuario_id, transport_error=transport_err)
        return HorariosImportarResponse(
            msg=transport_err,
            code=None,
            title="Error de servicio",
            horario_importacion_id=row.horario_importacion_id,
        )

    update_importacion_result(db, row, current_user.usuario_id, n8n_body=n8n_body)
    msg, code, title = _normalize_n8n_payload(n8n_body)
    return HorariosImportarResponse(
        msg=msg,
        code=code,
        title=title,
        horario_importacion_id=row.horario_importacion_id,
    )


@router.get("/importaciones", response_model=List[HorarioImportacionListItem])
def historial_importaciones(
    proyecto_id: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    allowed = get_user_proyectos(db, current_user.usuario_id)
    if proyecto_id:
        if not get_proyecto_by_id(db, proyecto_id):
            raise HTTPException(status_code=404, detail="Proyecto no encontrado")
        if not can_access_proyecto(db, current_user.usuario_id, proyecto_id):
            raise HTTPException(status_code=404, detail="Proyecto no encontrado")

    items = list_importaciones(
        db,
        proyecto_id=proyecto_id,
        allowed_proyecto_ids=allowed,
        limit=min(limit, 200),
    )
    return [HorarioImportacionListItem.model_validate(x) for x in items]


@router.get("/importaciones/{horario_importacion_id}", response_model=HorarioImportacionDetail)
def obtener_importacion(
    horario_importacion_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    row = get_importacion_by_id(db, horario_importacion_id)
    if not row or not can_access_proyecto(db, current_user.usuario_id, row.proyecto_id):
        raise HTTPException(status_code=404, detail="Importación no encontrada")
    return HorarioImportacionDetail.model_validate(row)


@router.put("/importaciones/{horario_importacion_id}", response_model=HorarioImportacionDetail)
def actualizar_importacion(
    horario_importacion_id: str,
    body: HorarioImportacionUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    row = get_importacion_by_id(db, horario_importacion_id)
    if not row or not can_access_proyecto(db, current_user.usuario_id, row.proyecto_id):
        raise HTTPException(status_code=404, detail="Importación no encontrada")
    updated = update_importacion_datos(
        db,
        row,
        anio=body.anio,
        numero_semana=body.numero_semana,
        url_archivo=body.url,
        usuario_id=current_user.usuario_id,
    )
    return HorarioImportacionDetail.model_validate(updated)


@router.delete("/importaciones/{horario_importacion_id}", status_code=204)
def eliminar_importacion(
    horario_importacion_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
):
    row = get_importacion_by_id(db, horario_importacion_id)
    if not row or not can_access_proyecto(db, current_user.usuario_id, row.proyecto_id):
        raise HTTPException(status_code=404, detail="Importación no encontrada")
    if not delete_importacion(db, horario_importacion_id):
        raise HTTPException(status_code=404, detail="Importación no encontrada")
