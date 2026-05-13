import uuid
from sqlalchemy import Column, String, ForeignKey, Numeric, Boolean, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.audit import AuditMixin


def generate_uuid_hex():
    return uuid.uuid4().hex


class Ruta(Base, AuditMixin):
    __tablename__ = "ruta"

    ruta_id = Column(String(32), primary_key=True, default=generate_uuid_hex)
    proyecto_id = Column(String(32), ForeignKey("proyecto.proyecto_id", ondelete="CASCADE"), nullable=False)
    nombre = Column(String(100), nullable=False)
    codigo = Column(String(50), nullable=True)
    punto_inicio = Column(String(30), nullable=False, default="domicilio")
    sector = Column(String(100), nullable=True)
    geocerca = Column(Text, nullable=True)  # GeoJSON o coordenadas
    costo_base = Column(Numeric(10, 2), nullable=True)
    tipo = Column(String(20), nullable=False, default="diurna")  # diurna, nocturna, ambas
    activo = Column(Boolean, default=True, nullable=False)

    proyecto = relationship("Proyecto", back_populates="rutas")
    pasajeros = relationship("Pasajero", back_populates="ruta")
    conductor_rutas = relationship(
        "ConductorRuta",
        back_populates="ruta",
        cascade="all, delete-orphan",
    )
    vehiculos = relationship("Vehiculo", back_populates="ruta")
