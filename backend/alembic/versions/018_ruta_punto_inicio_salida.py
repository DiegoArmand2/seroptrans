"""ruta: punto_inicio_salida

Revision ID: 018
Revises: 017

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "018"
down_revision: Union[str, None] = "017"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "ruta",
        sa.Column(
            "punto_inicio_salida",
            sa.String(30),
            nullable=False,
            server_default="domicilio",
        ),
    )
    op.alter_column("ruta", "punto_inicio_salida", server_default=None)


def downgrade() -> None:
    op.drop_column("ruta", "punto_inicio_salida")
