"""add equipment extra fields to dao_price_equ

Revision ID: 0004_add_equ_fields
Revises: 0003_add_unite_origine
Create Date: 2025-09-04 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0004_add_equ_fields'
down_revision = '0003_add_unite_origine'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    try:
        res = conn.execute(sa.text("PRAGMA table_info('dao_price_equ')"))
        existing = [row[1] for row in res.fetchall()]
    except Exception:
        existing = []

    if 'materiel_id' not in existing:
        op.add_column('dao_price_equ', sa.Column('materiel_id', sa.Integer(), nullable=True))
    if 'dt_percent' not in existing:
        op.add_column('dao_price_equ', sa.Column('dt_percent', sa.Numeric(7,4), nullable=True))
    if 'dt_value' not in existing:
        op.add_column('dao_price_equ', sa.Column('dt_value', sa.Numeric(19,2), nullable=True))
    if 'vr_plus_taxes' not in existing:
        op.add_column('dao_price_equ', sa.Column('vr_plus_taxes', sa.Numeric(19,2), nullable=True))
    if 'nj' not in existing:
        op.add_column('dao_price_equ', sa.Column('nj', sa.Numeric(19,2), nullable=True))
    if 'amort_j' not in existing:
        op.add_column('dao_price_equ', sa.Column('amort_j', sa.Numeric(19,2), nullable=True))
    if 'cc' not in existing:
        op.add_column('dao_price_equ', sa.Column('cc', sa.Numeric(19,2), nullable=True))
    if 'cl' not in existing:
        op.add_column('dao_price_equ', sa.Column('cl', sa.Numeric(19,2), nullable=True))
    if 'cpr' not in existing:
        op.add_column('dao_price_equ', sa.Column('cpr', sa.Numeric(19,2), nullable=True))
    if 'tlpr_percent' not in existing:
        op.add_column('dao_price_equ', sa.Column('tlpr_percent', sa.Numeric(7,4), nullable=True))
    if 'tlpr_value' not in existing:
        op.add_column('dao_price_equ', sa.Column('tlpr_value', sa.Numeric(19,2), nullable=True))
    if 'cmo' not in existing:
        op.add_column('dao_price_equ', sa.Column('cmo', sa.Numeric(19,2), nullable=True))
    if 'tj' not in existing:
        op.add_column('dao_price_equ', sa.Column('tj', sa.Numeric(19,2), nullable=True))
    if 'twm' not in existing:
        op.add_column('dao_price_equ', sa.Column('twm', sa.Numeric(19,2), nullable=True))
    if 'total_h' not in existing:
        op.add_column('dao_price_equ', sa.Column('total_h', sa.Numeric(19,4), nullable=True))


def downgrade():
    conn = op.get_bind()
    try:
        res = conn.execute(sa.text("PRAGMA table_info('dao_price_equ')"))
        existing = [row[1] for row in res.fetchall()]
    except Exception:
        existing = []

    if 'total_h' in existing:
        op.drop_column('dao_price_equ', 'total_h')
    if 'twm' in existing:
        op.drop_column('dao_price_equ', 'twm')
    if 'tj' in existing:
        op.drop_column('dao_price_equ', 'tj')
    if 'cmo' in existing:
        op.drop_column('dao_price_equ', 'cmo')
    if 'tlpr_value' in existing:
        op.drop_column('dao_price_equ', 'tlpr_value')
    if 'tlpr_percent' in existing:
        op.drop_column('dao_price_equ', 'tlpr_percent')
    if 'cpr' in existing:
        op.drop_column('dao_price_equ', 'cpr')
    if 'cl' in existing:
        op.drop_column('dao_price_equ', 'cl')
    if 'cc' in existing:
        op.drop_column('dao_price_equ', 'cc')
    if 'amort_j' in existing:
        op.drop_column('dao_price_equ', 'amort_j')
    if 'nj' in existing:
        op.drop_column('dao_price_equ', 'nj')
    if 'vr_plus_taxes' in existing:
        op.drop_column('dao_price_equ', 'vr_plus_taxes')
    if 'dt_value' in existing:
        op.drop_column('dao_price_equ', 'dt_value')
    if 'dt_percent' in existing:
        op.drop_column('dao_price_equ', 'dt_percent')
    if 'materiel_id' in existing:
        op.drop_column('dao_price_equ', 'materiel_id')
