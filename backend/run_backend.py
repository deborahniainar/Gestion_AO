import sys, os
sys.path.append(os.path.dirname(__file__))  # ajoute le dossier courant au PYTHONPATH

import uvicorn

if __name__ == "__main__":
    # Bind on all interfaces so external services (e.g., OnlyOffice DS container) can reach the API
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
