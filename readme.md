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
   - Historique des utilisations par chantier

3) Gestion des personnels
   - Fiches personnels, spécialités
   - Disponibilité, affectation par projet/chantier
   - Historique de participation

4) Base de prix interne
   - Historique des prix unitaires par type de tâche/poste
   - Mise à jour manuelle ou automatisée
   - Salaires journaliers (homme-jour), marges bénéficiaires
   - Aide à la tarification rapide pour les soumissions

5) Gestion des documents administratifs
   - Archivage des documents légaux
   - Alertes de renouvellement (expiration)
   - Téléchargement rapide pour chaque soumission

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

```
Gestion_AO/
├── backend/                       # Backend Python (FastAPI)
│   ├── app/
│   │   ├── api/                   # Routes API (DAO, soumissions, marchés, ...)
│   │   ├── core/                  # Config globale (config, security, logging)
│   │   ├── crud/                  # Fonctions CRUD (à compléter)
│   │   ├── db/                    # Base models + session SQLAlchemy
│   │   ├── schemas/              
│   │   ├── services/              # PDF/NLP/Doc generation/Notifications
│   │   ├── sql/                   
│   │   ├── tasks/                 # Celery (optionnel)
│   │   ├── main.py                # Entrée FastAPI
│   │   └── dependencies.py        # Dépendances (auth, DB, etc.)
│   ├── files
│   ├── venv
│   ├── alembic.ini
│   ├── dev.db
│   ├── Dockerfile          
│   └── requirements.txt
│
├── frontend/                      # Frontend React + Vite (JavaScript)
│   ├── public/
│   ├── src/
│   │   ├── components/            # Composants réutilisables
│   │   │   ├── common/            # Composants génériques
│   │   │   ├── layout/            # Header, Sidebar, Footer
│   │   │   └── forms/             # Formulaires spécialisés
│   │   ├── pages/                 # Pages principales
│   │   │   ├── auth/              # Login, Register
│   │   │   ├── dashboard/         # Tableau de bord
│   │   │   ├── dao/               # Gestion des appels d'offres
│   │   │   ├── soumissions/       # Gestion des soumissions
│   │   │   ├── marches/           # Gestion des marchés
│   │   │   ├── materiels/         # Gestion des matériels
│   │   │   ├── personnels/        # Gestion du personnel
│   │   │   ├── prix/              # Base de prix
│   │   │   └── documents/         # Documents administratifs
│   │   ├── hooks/                 # Hooks personnalisés
│   │   ├── services/              # Services API
│   │   ├── utils/                 # Fonctions utilitaires
│   │   ├── contexts/              # Contextes React (Auth, etc.)
│   │   ├── assets/                # Images, icônes, etc.
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── .env
│   └── Dockerfile
│
├── docker-compose.yml             # Orchestration (backend, frontend, db, redis)
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
- Frontend: React, JavaScript, Vite, Bootstrap 5

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
# REDIS_URL=redis://redis:6379/0  # Optionnel
JWT_SECRET=change-me
```

Variables d'environnement frontend (fichier `frontend/.env`):

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=Gestion AO
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
