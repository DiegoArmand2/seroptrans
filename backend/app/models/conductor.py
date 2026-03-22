import uuid
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.audit import AuditMixin


def generate_uuid_hex():
    return uuid.uuid4().hex


class ConductorRuta(Base, AuditMixin):
    """Asociación Conductor-Ruta (diurna o nocturna)."""
    __tablename__ = "conductor_ruta"

    conductorruta_id = Column(String(32), primary_key=True, default=generate_uuid_hex)
    conductor_id = Column(String(32), ForeignKey("conductor.conductor_id", ondelete="CASCADE"), nullable=False)
    ruta_id = Column(String(32), ForeignKey("ruta.ruta_id", ondelete="CASCADE"), nullable=False)
    tipo = Column(String(20), nullable=False)  # diurna, nocturna

    conductor = relationship("Conductor", back_populates="rutas_asignadas")
    ruta = relationship("Ruta", back_populates="conductor_rutas")


class Conductor(Base, AuditMixin):
    """Conductor (persona) - el chofer asignado a vehículos."""
    __tablename__ = "conductor"

    conductor_id = Column(String(32), primary_key=True, default=generate_uuid_hex)
    nombre = Column(String(100), nullable=False)
    disponible = Column(Boolean, default=True, nullable=False)
    activo = Column(Boolean, default=True, nullable=False)

    vehiculos = relationship(
        "Vehiculo",
        back_populates="conductor",
        cascade="all, delete-orphan",
    )
    proyectos = relationship(
        "ProyectoConductor",
        back_populates="conductor",
        cascade="all, delete-orphan",
    )
    rutas_asignadas = relationship(
        "ConductorRuta",
        back_populates="conductor",
        cascade="all, delete-orphan",
    )


class ProyectoConductor(Base, AuditMixin):
    __tablename__ = "proyecto_conductor"

    proyectocon_id = Column(String(32), primary_key=True, default=generate_uuid_hex)
    proyecto_id = Column(String(32), ForeignKey("proyecto.proyecto_id", ondelete="CASCADE"), nullable=False)
    conductor_id = Column(String(32), ForeignKey("conductor.conductor_id", ondelete="CASCADE"), nullable=False)

    proyecto = relationship("Proyecto", back_populates="conductores")
    conductor = relationship("Conductor", back_populates="proyectos")
