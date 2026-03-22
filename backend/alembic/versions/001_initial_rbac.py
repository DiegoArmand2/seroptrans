"""Initial RBAC tables

Revision ID: 001
Revises: 
Create Date: 2024-01-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'usuario',
        sa.Column('usuario_id', sa.String(32), primary_key=True),
        sa.Column('login', sa.String(30), nullable=False, unique=True),
        sa.Column('password', sa.String(255), nullable=False),
        sa.Column('nombre_usuario', sa.String(60), nullable=False),
        sa.Column('email', sa.String(60), nullable=True),
        sa.Column('telefono', sa.Numeric(10), nullable=True),
        sa.Column('direccion', sa.String(200), nullable=True),
        sa.Column('fotografia', sa.LargeBinary(), nullable=True),
    )
    op.create_table(
        'rol',
        sa.Column('rol_id', sa.String(32), primary_key=True),
        sa.Column('nombre', sa.String(60), nullable=False),
        sa.Column('descripcion', sa.String(200), nullable=True),
    )

    op.create_table(
        'rol_usuario',
        sa.Column('roluser_id', sa.String(32), primary_key=True),
        sa.Column('rol_id', sa.String(32), sa.ForeignKey('rol.rol_id', ondelete='CASCADE'), nullable=False),
        sa.Column('usuario_id', sa.String(32), sa.ForeignKey('usuario.usuario_id', ondelete='CASCADE'), nullable=False),
    )

    op.create_table(
        'rol_permiso_ventana',
        sa.Column('rolwin_id', sa.String(32), primary_key=True),
        sa.Column('rol_id', sa.String(32), sa.ForeignKey('rol.rol_id', ondelete='CASCADE'), nullable=False),
        sa.Column('ventana', sa.String(100), nullable=False),
    )

    op.create_table(
        'rol_permiso_proceso',
        sa.Column('rolpro_id', sa.String(32), primary_key=True),
        sa.Column('rol_id', sa.String(32), sa.ForeignKey('rol.rol_id', ondelete='CASCADE'), nullable=False),
        sa.Column('proceso', sa.String(100), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('rol_permiso_proceso')
    op.drop_table('rol_permiso_ventana')
    op.drop_table('rol_usuario')
    op.drop_table('rol')
    op.drop_table('usuario')
