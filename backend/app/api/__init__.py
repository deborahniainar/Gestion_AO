from .soumissions import router as soumissions_router
from .appels_offre import router as appels_offre_router
from .materiels import router as materiels_router
from .personnels import router as personnels_router
from .prix import router as prix_router
from .documents import router as documents_router
from .admins import router as admins_router
from .clients import router as clients_router
from .specialites import router as specialites_router
from .postes import router as postes_router
from .fournisseurs import router as fournisseurs_router
from .soumission_details import router as soumission_details_router
from .dashboard import router as dashboard_router
from .auth import router as auth_router
from .dao import router as dao_router

routers = [
    soumissions_router,
    appels_offre_router,
    materiels_router,
    personnels_router,
    prix_router,
    documents_router,
    admins_router,
    clients_router,
    specialites_router,
    postes_router,
    fournisseurs_router,
    soumission_details_router,
    dashboard_router,
    auth_router,
    dao_router,
]

