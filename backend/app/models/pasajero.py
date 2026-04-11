import uuid
from sqlalchemy import Boolean, Column, String, ForeignKey, Numeric, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.audit import AuditMixin


def generate_uuid_hex():
    return uuid.uuid4().hex


class Pasajero(Base, AuditMixin):
    __tablename__ = "pasajero"

    pasajero_id = Column(String(32), primary_key=True, default=generate_uuid_hex)
    proyecto_id = Column(String(32), ForeignKey("proyecto.proyecto_id", ondelete="CASCADE"), nullable=False)
    cedula = Column(String(20), nullable=False)
    nombre = Column(String(100), nullable=False)
    direccion = Column(String(300), nullable=True)
    lat = Column(Numeric(10, 7), nullable=True)
    lng = Column(Numeric(10, 7), nullable=True)
    ruta_id = Column(String(32), ForeignKey("ruta.ruta_id", ondelete="SET NULL"), nullable=True)
    tipo_pasajero_id = Column(String(32), ForeignKey("tipo_pasajero.tipo_pasajero_id", ondelete="SET NULL"), nullable=True)
    horario_habitual = Column(String(50), nullable=True)
    placa_asignada = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=True)
    activo = Column(Boolean, default=True, nullable=False)

    proyecto = relationship("Proyecto", back_populates="pasajeros")
    ruta = relationship("Ruta", back_populates="pasajeros")
    tipo_pasajero = relationship("TipoPasajero", back_populates="pasajeros")
