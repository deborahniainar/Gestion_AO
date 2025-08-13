from .dao import router as dao_router
from .soumissions import router as soumissions_router
from .marches import router as marches_router
from .materiels import router as materiels_router
from .personnels import router as personnels_router
from .prix import router as prix_router
from .documents import router as documents_router
from .dashboard import router as dashboard_router

routers = [
    dao_router,
    soumissions_router,
    marches_router,
    materiels_router,
    personnels_router,
    prix_router,
    documents_router,
    dashboard_router,
]

