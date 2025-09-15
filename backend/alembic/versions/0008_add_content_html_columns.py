"""add content_html columns

Revision ID: 0008_add_content_html_columns
Revises: 0007_add_sdp_cost_net_per_unit
Create Date: 2025-09-15 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0008_add_content_html_columns'
down_revision = '0007_add_sdp_cost_net_per_unit'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('soumission_subtasks', sa.Column('content_html', sa.Text(), nullable=True))
    op.add_column('dao_subtasks', sa.Column('content_html', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('soumission_subtasks', 'content_html')
    op.drop_column('dao_subtasks', 'content_html')
