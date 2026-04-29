import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Integer, SmallInteger, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


def generate_uuid_hex():
    return uuid.uuid4().hex


class DemandaViaje(Base):
    __tablename__ = "demanda_viajes"

    demanda_viaje_id = Column(String(32), primary_key=True, default=generate_uuid_hex)
    turno_id = Column(String(32), ForeignKey("turno.turno_id", ondelete="CASCADE"), nullable=False)
    horario_importacion_id = Column(
        String(32),
        ForeignKey("horario_importacion.horario_importacion_id", ondelete="SET NULL"),
        nullable=True,
    )
    pasajero_id = Column(String(32), ForeignKey("pasajero.pasajero_id", ondelete="SET NULL"), nullable=True)
    dia = Column(String(15), nullable=False)
    sector = Column(String(100), nullable=False)
    hora_ini = Column(SmallInteger, nullable=False)
    min_ini = Column(SmallInteger, nullable=False)
    hora_fin = Column(SmallInteger, nullable=False)
    min_fin = Column(SmallInteger, nullable=False)
    dia_fin = Column(String(15), nullable=False)
    cedula = Column(String(20), nullable=False)
    nombre = Column(String(150), nullable=False)
    fecha = Column(DateTime, nullable=False, server_default=func.now())
    anio = Column(Integer, nullable=True)
    numero_semana = Column(Integer, nullable=True)
    tipo = Column(String(50), nullable=True)
    dia_numero = Column(Integer, nullable=True)

    turno = relationship("Turno", back_populates="demanda_viajes")
    horario_importacion = relationship("HorarioImportacion", back_populates="demanda_viajes")
    pasajero = relationship("Pasajero", back_populates="demanda_viajes")
