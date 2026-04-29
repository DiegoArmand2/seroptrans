import uuid
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.audit import AuditMixin


def generate_uuid_hex():
    return uuid.uuid4().hex


class Vehiculo(Base, AuditMixin):
    """Vehículo con placa, capacidad, conductor y ruta."""
    __tablename__ = "vehiculo"

    vehiculo_id = Column(String(32), primary_key=True, default=generate_uuid_hex)
    placa = Column(String(20), nullable=False)
    capacidad = Column(Integer, default=16, nullable=False)
    conductor_id = Column(String(32), ForeignKey("conductor.conductor_id", ondelete="SET NULL"), nullable=True)
    ruta_id = Column(String(32), ForeignKey("ruta.ruta_id", ondelete="SET NULL"), nullable=True)
    proyecto_id = Column(String(32), ForeignKey("proyecto.proyecto_id", ondelete="CASCADE"), nullable=False)
    tipo_vehiculo_id = Column(String(32), ForeignKey("tipo_vehiculo.tipo_vehiculo_id", ondelete="SET NULL"), nullable=True)
    activo = Column(Boolean, default=True, nullable=False)

    conductor = relationship("Conductor", back_populates="vehiculos")
    ruta = relationship("Ruta", back_populates="vehiculos")
    tipo_vehiculo = relationship("TipoVehiculo", back_populates="vehiculos")
    proyecto = relationship("Proyecto", back_populates="vehiculos")
