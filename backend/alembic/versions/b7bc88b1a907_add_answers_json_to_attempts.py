"""add answers_json to attempts

Revision ID: b7bc88b1a907
Revises: 3aca1143bd09
Create Date: 2025-11-05 13:38:50.147672

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7bc88b1a907'
down_revision: Union[str, Sequence[str], None] = '3aca1143bd09'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'user_quiz_attempts',
        sa.Column('answers_json', sa.Text(), nullable=True)
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('user_quiz_attempts', 'answers_json')
