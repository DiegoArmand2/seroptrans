"""add audit columns to RBAC tables

Revision ID: 004
Revises: 003

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _add_audit_cols(table: str) -> None:
    op.add_column(table, sa.Column("fecha_creacion", sa.DateTime(), nullable=False, server_default=sa.func.now()))
    op.add_column(table, sa.Column("creado_por", sa.String(32), nullable=True))
    op.add_column(table, sa.Column("fecha_actualizacion", sa.DateTime(), nullable=True))
    op.add_column(table, sa.Column("actualizado_por", sa.String(32), nullable=True))


def _drop_audit_cols(table: str) -> None:
    op.drop_column(table, "actualizado_por")
    op.drop_column(table, "fecha_actualizacion")
    op.drop_column(table, "creado_por")
    op.drop_column(table, "fecha_creacion")


def upgrade() -> None:
    _add_audit_cols("usuario")
    _add_audit_cols("rol")
    _add_audit_cols("rol_usuario")
    _add_audit_cols("rol_permiso_ventana")
    _add_audit_cols("rol_permiso_proceso")
    # En esta base, la tabla no existía en 001_initial_rbac.py. La creamos aquí ya con auditoría.
    op.create_table(
        "rol_permiso_proyecto",
        sa.Column("rolproy_id", sa.String(32), primary_key=True),
        sa.Column("rol_id", sa.String(32), sa.ForeignKey("rol.rol_id", ondelete="CASCADE"), nullable=False),
        sa.Column(
            "proyecto_id",
            sa.String(32),
            sa.ForeignKey("proyecto.proyecto_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("fecha_creacion", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("creado_por", sa.String(32), nullable=True),
        sa.Column("fecha_actualizacion", sa.DateTime(), nullable=True),
        sa.Column("actualizado_por", sa.String(32), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("rol_permiso_proyecto")
    _drop_audit_cols("rol_permiso_proceso")
    _drop_audit_cols("rol_permiso_ventana")
    _drop_audit_cols("rol_usuario")
    _drop_audit_cols("rol")
    _drop_audit_cols("usuario")

