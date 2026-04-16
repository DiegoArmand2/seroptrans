import uuid
from sqlalchemy import Column, String, Boolean, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.audit import AuditMixin


def generate_uuid_hex():
    return uuid.uuid4().hex


class Proyecto(Base, AuditMixin):
    __tablename__ = "proyecto"

    proyecto_id = Column(String(32), primary_key=True, default=generate_uuid_hex)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(String(300), nullable=True)
    parametros_operativos = Column(Text, nullable=True)  # JSON: ocupacion_maxima, costos, etc.
    activo = Column(Boolean, default=True, nullable=False)

    turnos = relationship("Turno", back_populates="proyecto", cascade="all, delete-orphan")
    tipos_pasajero = relationship("TipoPasajero", back_populates="proyecto", cascade="all, delete-orphan")
    tipos_vehiculo = relationship("TipoVehiculo", back_populates="proyecto", cascade="all, delete-orphan")
    rutas = relationship("Ruta", back_populates="proyecto", cascade="all, delete-orphan")
    pasajeros = relationship("Pasajero", back_populates="proyecto", cascade="all, delete-orphan")
    conductores = relationship(
        "ProyectoConductor",
        back_populates="proyecto",
        cascade="all, delete-orphan",
    )
    vehiculos = relationship(
        "Vehiculo",
        back_populates="proyecto",
        cascade="all, delete-orphan",
    )
