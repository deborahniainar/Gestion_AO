"""add transport/taxes/perte fields to dao_price_mtx

Revision ID: 0002_add_mtx_fields
Revises: 0001_add_dao_tables
Create Date: 2025-09-03 11:50:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0002_add_mtx_fields'
down_revision = '0001_add_dao_tables'
branch_labels = None
depends_on = None


def upgrade():
    # make migration idempotent: add columns only if they don't already exist
    conn = op.get_bind()
    try:
        res = conn.execute(sa.text("PRAGMA table_info('dao_price_mtx')"))
        existing = [row[1] for row in res.fetchall()]
    except Exception:
        existing = []

    if 'transport' not in existing:
        op.add_column('dao_price_mtx', sa.Column('transport', sa.Numeric(19,2), nullable=True))
    if 'taxes' not in existing:
        op.add_column('dao_price_mtx', sa.Column('taxes', sa.Numeric(19,2), nullable=True))
    if 'perte_percent' not in existing:
        op.add_column('dao_price_mtx', sa.Column('perte_percent', sa.Numeric(19,2), nullable=True))
    if 'perte_valeur' not in existing:
        op.add_column('dao_price_mtx', sa.Column('perte_valeur', sa.Numeric(19,2), nullable=True))


def downgrade():
    # attempt to drop columns if they exist
    conn = op.get_bind()
    try:
        res = conn.execute(sa.text("PRAGMA table_info('dao_price_mtx')"))
        existing = [row[1] for row in res.fetchall()]
    except Exception:
        existing = []

    if 'perte_valeur' in existing:
        op.drop_column('dao_price_mtx', 'perte_valeur')
    if 'perte_percent' in existing:
        op.drop_column('dao_price_mtx', 'perte_percent')
    if 'taxes' in existing:
        op.drop_column('dao_price_mtx', 'taxes')
    if 'transport' in existing:
        op.drop_column('dao_price_mtx', 'transport')
