"""ruta: punto_inicio_enabled

Revision ID: 021
Revises: 020

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "021"
down_revision: Union[str, None] = "020"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "ruta",
        sa.Column(
            "punto_inicio_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.alter_column("ruta", "punto_inicio_enabled", server_default=None)


def downgrade() -> None:
    op.drop_column("ruta", "punto_inicio_enabled")
