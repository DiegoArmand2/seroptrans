import uuid
from sqlalchemy import Column, String, Numeric, LargeBinary
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.audit import AuditMixin


def generate_uuid_hex():
    return uuid.uuid4().hex


class Usuario(Base, AuditMixin):
    __tablename__ = "usuario"

    usuario_id = Column(String(32), primary_key=True, default=generate_uuid_hex)
    login = Column(String(30), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    nombre_usuario = Column(String(60), nullable=False)
    email = Column(String(60), nullable=True)
    telefono = Column(Numeric(10), nullable=True)
    direccion = Column(String(200), nullable=True)
    fotografia = Column(LargeBinary, nullable=True)

    roles = relationship("RolUsuario", back_populates="usuario", cascade="all, delete-orphan")
