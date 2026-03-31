import uuid
from sqlalchemy import Column, String, ForeignKey, Text, Date, Integer
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.audit import AuditMixin


def generate_uuid_hex():
    return uuid.uuid4().hex


class HorarioImportacion(Base, AuditMixin):
    __tablename__ = "horario_importacion"

    horario_importacion_id = Column(String(32), primary_key=True, default=generate_uuid_hex)
    proyecto_id = Column(String(32), ForeignKey("proyecto.proyecto_id", ondelete="CASCADE"), nullable=False)
    fecha_referencia = Column(Date, nullable=False)
    url_archivo = Column(Text, nullable=False)
    respuesta_msg = Column(Text, nullable=True)
    respuesta_code = Column(Integer, nullable=True)
    respuesta_title = Column(String(300), nullable=True)
    respuesta_raw = Column(Text, nullable=True)

    proyecto = relationship("Proyecto")
