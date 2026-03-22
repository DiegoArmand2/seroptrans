import uuid
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.audit import AuditMixin


def generate_uuid_hex():
    return uuid.uuid4().hex


class Rol(Base, AuditMixin):
    __tablename__ = "rol"

    rol_id = Column(String(32), primary_key=True, default=generate_uuid_hex)
    nombre = Column(String(60), nullable=False)
    descripcion = Column(String(200), nullable=True)

    usuarios = relationship("RolUsuario", back_populates="rol", cascade="all, delete-orphan")
    permisos_ventana = relationship("RolPermisoVentana", back_populates="rol", cascade="all, delete-orphan")
    permisos_proceso = relationship("RolPermisoProceso", back_populates="rol", cascade="all, delete-orphan")
    permisos_proyecto = relationship("RolPermisoProyecto", back_populates="rol", cascade="all, delete-orphan")


class RolUsuario(Base, AuditMixin):
    __tablename__ = "rol_usuario"

    roluser_id = Column(String(32), primary_key=True, default=generate_uuid_hex)
    rol_id = Column(String(32), ForeignKey("rol.rol_id", ondelete="CASCADE"), nullable=False)
    usuario_id = Column(String(32), ForeignKey("usuario.usuario_id", ondelete="CASCADE"), nullable=False)

    rol = relationship("Rol", back_populates="usuarios")
    usuario = relationship("Usuario", back_populates="roles")


class RolPermisoVentana(Base, AuditMixin):
    __tablename__ = "rol_permiso_ventana"

    rolwin_id = Column(String(32), primary_key=True, default=generate_uuid_hex)
    rol_id = Column(String(32), ForeignKey("rol.rol_id", ondelete="CASCADE"), nullable=False)
    ventana = Column(String(100), nullable=False)

    rol = relationship("Rol", back_populates="permisos_ventana")


class RolPermisoProceso(Base, AuditMixin):
    __tablename__ = "rol_permiso_proceso"

    rolpro_id = Column(String(32), primary_key=True, default=generate_uuid_hex)
    rol_id = Column(String(32), ForeignKey("rol.rol_id", ondelete="CASCADE"), nullable=False)
    proceso = Column(String(100), nullable=False)

    rol = relationship("Rol", back_populates="permisos_proceso")


class RolPermisoProyecto(Base, AuditMixin):
    __tablename__ = "rol_permiso_proyecto"

    rolproy_id = Column(String(32), primary_key=True, default=generate_uuid_hex)
    rol_id = Column(String(32), ForeignKey("rol.rol_id", ondelete="CASCADE"), nullable=False)
    proyecto_id = Column(String(32), ForeignKey("proyecto.proyecto_id", ondelete="CASCADE"), nullable=False)

    rol = relationship("Rol", back_populates="permisos_proyecto")
    proyecto = relationship("Proyecto")
