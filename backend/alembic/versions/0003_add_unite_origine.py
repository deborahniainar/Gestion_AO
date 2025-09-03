"""add unite and origine to dao_price_mtx

Revision ID: 0003_add_unite_origine
Revises: 0002_add_mtx_fields
Create Date: 2025-09-03 12:20:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0003_add_unite_origine'
down_revision = '0002_add_mtx_fields'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    try:
        res = conn.execute(sa.text("PRAGMA table_info('dao_price_mtx')"))
        existing = [row[1] for row in res.fetchall()]
    except Exception:
        existing = []

    if 'unite' not in existing:
        op.add_column('dao_price_mtx', sa.Column('unite', sa.String(length=64), nullable=True))
    if 'origine' not in existing:
        op.add_column('dao_price_mtx', sa.Column('origine', sa.String(length=255), nullable=True))


def downgrade():
    conn = op.get_bind()
    try:
        res = conn.execute(sa.text("PRAGMA table_info('dao_price_mtx')"))
        existing = [row[1] for row in res.fetchall()]
    except Exception:
        existing = []

    if 'origine' in existing:
        op.drop_column('dao_price_mtx', 'origine')
    if 'unite' in existing:
        op.drop_column('dao_price_mtx', 'unite')
