# Gestion AO — Plateforme intelligente de gestion des appels d'offres

Plateforme permettant de traiter un Dossier d'Appel d'Offres (DAO) en entrée, d'extraire automatiquement les informations clés, de générer une réponse structurée (documents de soumission), et de piloter l'ensemble du cycle de vie des appels d'offres, marchés, matériels, personnels et documents administratifs.

## Objectif

- Prendre en entrée un DAO (PDF)
- Enregistrer les appels d'offres reçus
- Résumer automatiquement le contenu du DAO
- Extraire les éléments clés (date limite, montant de la garantie, objet, pièces demandées, critères de sélection, etc.)
- Générer une réponse structurée (lettre de soumission, fiches techniques, tableaux de prix, modèles, etc.)
- Permettre à l'utilisateur de modifier facilement la réponse (interface web)
- Exporter les documents finaux en PDF ou Word
- Gérer les fournisseurs de matériaux et services

## Fonctionnalités clés

1) Gestion des Dossiers d'Appel d'Offres (DAO)
   - Upload du DAO (PDF)
   - Extraction intelligente (objet, date limite, montants, exigences, pièces, critères)
   - Résumé automatique
   - Générateur de réponse modifiable (lettre, fiches, bordereau, etc.)
   - Assistant de remplissage (UI interactive pour personnaliser les données)

2) Suivi des matériels
   - Inventaire, disponibilité, localisation, état
   - Historique des utilisations par projet/poste

3) Gestion des personnels
   - Fiches personnels, spécialités
   - Disponibilité, affectation par projet/poste
   - Historique de participation

4) Base de prix interne
   - Historique des prix unitaires par type de tâche/poste
   - Mise à jour manuelle ou automatisée
   - Salaires journaliers (homme-jour), marges bénéficiaires
   - Aide à la tarification rapide pour les soumissions
   - Géstion rapide et efficace des Sous-détails de Prix
   - Génération automatique du Bordereau de Prix

5) Gestion des documents administratifs
   - Archivage des documents légaux
   - Alertes de renouvellement (expiration)
   - Téléchargement rapide pour chaque soumission/Lot

6) Préparation des soumissions
   - Création de soumissions liées à un AO
   - Remplissage et créations des formulaire de soumission en ordre
   - Export de tous les documents en PDF/Word (prêts à imprimer/télécharger)

7) Tableau de bord et historique
   - Vue des AO en cours et passés
   - Historique des soumissions et résultats
   - Statistiques de rentabilité et taux de réussite

8) Authentification et sécurité
   - Connexion sécurisée (JWT)
   - Protection des routes sensibles
   - Gestion des sessions utilisateur

## Modules et sous-fonctionnalités

| Module           | Sous-fonctions                                                        |
|------------------|-----------------------------------------------------------------------|
| Gestion DAO      | Upload, analyse PDF, résumé, extraction automatique                   |
| Matériels        | Inventaire, état, localisation, historique par chantier               |
| Personnels       | Fiches, spécialité, affectation chantier                              |
| Prix             | PU par tâche, salaires, marges, estimation rapide                     |
| Docs admin       | Archivage, alertes de validité, accès rapide                          |
| Soumission       | Lettre, fiche, bordereau, validation, export                          |
| Dashboard        | Vue globale, historique AO, taux de succès                            |
| Authentification | Login, JWT, protection des routes                                     |

---

## Architecture du projet

Monorepo avec un backend FastAPI (Python) et un frontend React + Vite (JavaScript). Redis/Celery optionnels pour les tâches asynchrones; PostgreSQL conseillé pour la persistance.

```Structure du projet
Gestion_AO/
├── backend/                       # Backend Python (FastAPI)
│   ├── app/
│   │   ├── api/                   # Routes API (admins, appels_offre, auth, clients, dao, dashboard, documents, ...)
│   │   ├── core/                  # Config globale (config, security, logging)
│   │   ├── db/                    # Base models + session SQLAlchemy
│   │   ├── schemas/               
│   │   ├── services/              # PDF/NLP/Doc generation/Notifications
│   │   ├── sql/                   # bd default USer
│   │   ├── tasks/                 # Celery (optionnel)
│   │   ├── main.py                # Entrée FastAPI
│   │   └── dependencies.py        # Dépendances (auth, DB, etc.)
│   │   └── main_legacy.py        # Dépendances (auth, DB, etc.)
│   ├── files
│   ├── venv
│   ├── .env
│   ├── alembic.ini
│   ├── dev.db         
│   └── requirements.txt
│
├── frontend/                      # Frontend React + Vite (JavaScript)
│   ├── public/
│   ├── src/
│   │   ├── components/            # Sidebar.jsx, DocumentViewer.jsx         
│   │   ├── pages/         
│   │   │   ├── DAO.jsx        
│   │   │   ├── Dashboard.jsx  
│   │   │   ├── Document.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx           
│   │   │   ├── Matérieljsx       
│   │   │   ├── NotFound.jsx        
│   │   │   ├── OnlyOfficeWorkspace.jsx 
│   │   │   └── Personnel.jsx         
│   │   │   └── PriceBDE.jsx         
│   │   │   └── PriceEQU.jsx         
│   │   │   └── PriceMO.jsx         
│   │   │   └── PriceMTX.jsx         
│   │   │   └── PriceSDP.jsx         
│   │   │   └── Soumission.jsx         
│   │   │   └── WordEditor.jsx         
│   │   ├── hooks/                 # PrivateRoute.jsx, Usenotifications.js
│   │   ├── services/              # api.js, notifications.js
│   │   ├── contexts/              # AuthContext.jsx, DaoContext.jsx, ThemeContext.jsx
│   │   ├── assets/                # Images, icônes, etc.
│   │   ├── App.jsx                
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── .env
│
├── docker-compose.onlyoffice.yml  # OnlyOfficeConfig
├── .env                           # Variables d'environnement
└── readme.md
```

### Pile technique

- Backend: FastAPI, SQLAlchemy, Pydantic, Celery (optionnel)
- Authentification: JWT, passlib[bcrypt], PyJWT
- NLP/OCR/PDF: PyMuPDF, pytesseract, spaCy, transformers
- Génération de documents: python-docx, reportlab
- Base de données: PostgreSQL (recommandé) / SQLite (développement)
- Cache/Tasks: Redis (optionnel)
- Frontend: React, JavaScript, Vite, TailwindCss, MUI

---

## Prérequis

- Python ≥ 3.11
- Node.js ≥ 18 (recommandé 20)
- SQLite 3 (inclus avec Python par défaut)
- Redis (optionnel, si tâches Celery souhaitées)

## Installation

Depuis la racine du projet:

```bash
# Backend (Python)
python -m pip install --upgrade pip
pip install -r backend/requirements.txt

# Frontend (Node.js)
cd frontend
npm ci
cd ..
```

Variables d'environnement (fichier `.env` à la racine):

```env
APP_NAME=Gestion AO
DATABASE_URL=sqlite:///./dev.db
JWT_SECRET=change-me
```

Variables d'environnement frontend (fichier `frontend/.env`):

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=Gestion AO
VITE_TINYMCE_API_KEY=your_api_key
```

Variables d'environnement frontend (fichier `frontend/.env`):

```env
OPENAI_API_KEY=your_api_key
ONLYOFFICE_DS_URL=http://localhost:8080
BACKEND_PUBLIC_URL=http://172.17.0.1:8000
ONLYOFFICE_JWT_ENABLED=true
ONLYOFFICE_JWT_SECRET=your_api_key
```

## Démarrage

### 1. Initialisation de la base de données

```bash
cd backend
export PYTHONPATH="$(pwd)"
python -c "from app.db.base import Base; from app.db.session import engine; Base.metadata.create_all(bind=engine); print('Tables créées (si non existantes).')"
```

### 2. Création de l'utilisateur par défaut

### 3. Démarrage des services

#### Backend (FastAPI)

```bash
cd backend
export PYTHONPATH="$(pwd)"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend (React + Vite)

```bash
cd frontend
npm run dev
```

Le frontend sera accessible sur `http://localhost:5173` (port par défaut de Vite).
