import uuid
from sqlalchemy import Boolean, Column, String, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.audit import AuditMixin


def generate_uuid_hex():
    return uuid.uuid4().hex


class Turno(Base, AuditMixin):
    __tablename__ = "turno"

    turno_id = Column(String(32), primary_key=True, default=generate_uuid_hex)
    proyecto_id = Column(String(32), ForeignKey("proyecto.proyecto_id", ondelete="CASCADE"), nullable=False)
    nombre = Column(String(60), nullable=False)  # mañana, noche
    descripcion = Column(String(200), nullable=True)
    activo = Column(Boolean, default=True, nullable=False)

    proyecto = relationship("Proyecto", back_populates="turnos")
    vehiculos = relationship(
        "Vehiculo",
        back_populates="turno",
        cascade="all, delete-orphan",
    )
