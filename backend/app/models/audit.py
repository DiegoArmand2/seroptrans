"""Mixin de auditoría para modelos con CRUD.
Campos: fecha_creacion, creado_por, fecha_actualizacion, actualizado_por
"""
from datetime import datetime
from sqlalchemy import Column, String, DateTime


class AuditMixin:
    """Mixin que agrega campos de auditoría a cualquier modelo."""
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)
    creado_por = Column(String(32), nullable=True)  # usuario_id del creador
    fecha_actualizacion = Column(DateTime, nullable=True, onupdate=datetime.utcnow)
    actualizado_por = Column(String(32), nullable=True)  # usuario_id del último editor
