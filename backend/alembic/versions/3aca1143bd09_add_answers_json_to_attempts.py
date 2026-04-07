"""add answers_json to attempts

Revision ID: 3aca1143bd09
Revises: c5bbff360718
Create Date: 2025-11-05 13:33:52.044160

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3aca1143bd09'
down_revision: Union[str, Sequence[str], None] = 'c5bbff360718'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
