import uuid

from sqlalchemy import Column, ForeignKey, String
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.audit import AuditMixin


def generate_uuid_hex():
    return uuid.uuid4().hex


class TurnoPersonal(Base, AuditMixin):
    __tablename__ = "turnos_personal"

    turno_personal_id = Column(String(32), primary_key=True, default=generate_uuid_hex)
    horario_importacion_id = Column(
        String(32),
        ForeignKey("horario_importacion.horario_importacion_id", ondelete="CASCADE"),
        nullable=False,
    )
    proyecto_id = Column(String(32), ForeignKey("proyecto.proyecto_id", ondelete="CASCADE"), nullable=False)
    pasajero_id = Column(String(32), ForeignKey("pasajero.pasajero_id", ondelete="SET NULL"), nullable=True)

    empresa = Column(String(100), nullable=True)
    proceso = Column(String(100), nullable=True)
    cargo = Column(String(100), nullable=True)
    rut = Column(String(20), nullable=True)
    apellidos = Column(String(100), nullable=True)
    funcionarios = Column(String(100), nullable=True)
    dia_09 = Column(String(100), nullable=True)
    dia_10 = Column(String(100), nullable=True)
    dia_11 = Column(String(100), nullable=True)
    dia_12 = Column(String(100), nullable=True)
    dia_13 = Column(String(100), nullable=True)
    dia_14 = Column(String(100), nullable=True)
    dia_15 = Column(String(100), nullable=True)

    proyecto = relationship("Proyecto")
    pasajero = relationship("Pasajero")
    horario_importacion = relationship("HorarioImportacion")

