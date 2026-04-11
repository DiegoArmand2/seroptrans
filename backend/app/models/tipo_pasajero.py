import uuid
from sqlalchemy import Boolean, Column, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.audit import AuditMixin


def generate_uuid_hex():
    return uuid.uuid4().hex


class TipoPasajero(Base, AuditMixin):
    __tablename__ = "tipo_pasajero"
    __table_args__ = (UniqueConstraint("proyecto_id", "codigo", name="uq_tipo_pasajero_proyecto_codigo"),)

    tipo_pasajero_id = Column(String(32), primary_key=True, default=generate_uuid_hex)
    proyecto_id = Column(String(32), ForeignKey("proyecto.proyecto_id", ondelete="CASCADE"), nullable=False)
    codigo = Column(String(30), nullable=False)
    nombre = Column(String(60), nullable=False)
    descripcion = Column(String(200), nullable=True)
    activo = Column(Boolean, default=True, nullable=False)

    proyecto = relationship("Proyecto", back_populates="tipos_pasajero")
    pasajeros = relationship("Pasajero", back_populates="tipo_pasajero")
