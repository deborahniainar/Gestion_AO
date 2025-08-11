# Gestion AO — Plateforme intelligente de gestion des appels d’offres

Plateforme permettant de traiter un Dossier d’Appel d’Offres (DAO) en entrée, d’extraire automatiquement les informations clés, de générer une réponse structurée (documents de soumission), et de piloter l’ensemble du cycle de vie des appels d’offres, marchés, matériels, personnels et documents administratifs.

## Objectif
- Prendre en entrée un DAO (PDF)
- Enregistrer les appels d’offres reçus
- Résumer automatiquement le contenu du DAO
- Extraire les éléments clés (date limite, montant de la garantie, objet, pièces demandées, critères de sélection, etc.)
- Générer une réponse structurée (lettre de soumission, fiches techniques, tableaux de prix, modèles, etc.)
- Permettre à l’utilisateur de modifier facilement la réponse (interface web)
- Exporter les documents finaux en PDF ou Word
- Gérer les fournisseurs de matériaux et services

## Fonctionnalités clés
1) Gestion des Dossiers d’Appel d’Offres (DAO)
   - Upload du DAO (PDF)
   - Extraction intelligente (objet, date limite, montants, exigences, pièces, critères)
   - Résumé automatique
   - Générateur de réponse modifiable (lettre, fiches, bordereau, etc.)
   - Assistant de remplissage (UI interactive pour personnaliser les données)

2) Gestion des marchés
   - Enregistrement des AO (référence, client, objet, date limite)
   - Ajout et classement des documents reçus
   - Suivi de l’état (en cours, soumis, attribué, perdu)

3) Suivi des matériels
   - Inventaire, disponibilité, localisation, état
   - Historique des utilisations par chantier

4) Gestion des personnels
   - Fiches personnels, spécialités
   - Disponibilité, affectation par projet/chantier
   - Historique de participation

5) Base de prix interne
   - Historique des prix unitaires par type de tâche/poste
   - Mise à jour manuelle ou automatisée
   - Salaires journaliers (homme-jour), marges bénéficiaires
   - Aide à la tarification rapide pour les soumissions

6) Gestion des documents administratifs
   - Archivage des documents légaux
   - Alertes de renouvellement (expiration)
   - Téléchargement rapide pour chaque soumission

7) Préparation des soumissions
   - Création de soumissions liées à un AO
   - Calcul des totaux
   - Export de tous les documents en PDF/Word (prêts à imprimer/télécharger)

8) Tableau de bord et historique
   - Vue des AO en cours et passés
   - Historique des soumissions et résultats
   - Statistiques de rentabilité et taux de réussite

## Modules et sous-fonctionnalités

| Module        | Sous-fonctions                                                        |
|---------------|-----------------------------------------------------------------------|
| Gestion DAO   | Upload, analyse PDF, résumé, extraction automatique                   |
| Soumission    | Lettre, fiche, bordereau, validation, export                          |
| Marchés       | Suivi par statut, date, client, classement documents                  |
| Matériels     | Inventaire, état, localisation, historique par chantier               |
| Personnels    | Fiches, spécialité, affectation chantier                              |
| Prix          | PU par tâche, salaires, marges, estimation rapide                      |
| Docs admin    | Archivage, alertes de validité, accès rapide                          |
| Dashboard     | Vue globale, historique AO, taux de succès                            |

---

## Architecture du projet

Monorepo avec un backend FastAPI (Python) et un frontend React + Vite (TypeScript). Redis/Celery optionnels pour les tâches asynchrones; PostgreSQL conseillé pour la persistance.

```
Gestion_AO/
├── backend/                       # Backend Python (FastAPI)
│   ├── app/
│   │   ├── api/                   # Routes API (DAO, soumissions, marchés, ...)
│   │   ├── core/                  # Config globale (config, security, logging)
│   │   ├── crud/                  # Fonctions CRUD (à compléter)
│   │   ├── db/                    # Base models + session SQLAlchemy
│   │   ├── services/              # PDF/NLP/Doc generation/Notifications
│   │   ├── tasks/                 # Celery (optionnel)
│   │   ├── main.py                # Entrée FastAPI
│   │   └── dependencies.py        # Dépendances (auth, DB, etc.)
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                      # Frontend React + Vite (TypeScript)
│   ├── public/
│   ├── src/
│   │   ├── api/  assets/  components/  pages/  hooks/  contexts/  routes/  utils/
│   │   ├── App.tsx  │  index.tsx
│   ├── package.json
│   └── Dockerfile
│
├── scripts/                       # Outils de dev
│   ├── install_dependencies.sh
│   ├── run_backend.sh
│   ├── run_frontend.sh
│   └── init_db.sh
│
├── docker-compose.yml             # Orchestration (backend, frontend, db, redis)
├── .env                           # Variables d’environnement
└── readme.md
```

### Pile technique
- Backend: FastAPI, SQLAlchemy, Pydantic, Celery (optionnel)
- NLP/OCR/PDF: PyMuPDF, pytesseract, spaCy, transformers
- Génération de documents: python-docx, reportlab
- Base de données: PostgreSQL (recommandé)
- Cache/Tasks: Redis (optionnel)
- Frontend: React, TypeScript, Vite

---

## Prérequis
- Python ≥ 3.11
- Node.js ≥ 18 (recommandé 20)
- PostgreSQL (local ou via Docker)
- Redis (si tâches Celery souhaitées)

## Installation

Depuis la racine du projet:

```bash
./scripts/install_dependencies.sh
```

Variables d’environnement (fichier `.env` à la racine):

```env
APP_NAME=Gestion AO
DATABASE_URL=postgresql://postgres:postgres@db:5432/postgres
REDIS_URL=redis://redis:6379/0
JWT_SECRET=change-me
```

## Démarrage

Backend (FastAPI):
```bash
./scripts/run_backend.sh
```

Frontend (React):
```bash
./scripts/run_frontend.sh
```

Base de données (création des tables simples d’exemple):
```bash
./scripts/init_db.sh
```

### Docker (optionnel)
```bash
docker compose up --build
```

---

## Aperçu API (brouillon)

Routes de base déjà câblées (retour JSON vide/squelette):
- `GET /dao/` — liste/placeholder DAO
- `GET /soumissions/` — liste des soumissions
- `GET /marches/` — liste des marchés
- `GET /materiels/` — liste des matériels
- `GET /personnels/` — liste des personnels
- `GET /prix/` — base de prix
- `GET /documents/` — documents administratifs
- `GET /dashboard/stats` — statistiques

Exemple d’appel:

```bash
curl http://localhost:8000/dashboard/stats
```

Endpoints d’upload/traitement DAO, génération de documents et export seront ajoutés au fur et à mesure de l’implémentation (services `pdf_processing.py`, `nlp_processing.py`, `document_gen.py`).

---

## Flux fonctionnel (DAO → Soumission)
1. Upload d’un DAO (PDF)
2. Extraction texte + OCR si besoin (PyMuPDF, pytesseract)
3. NLP: résumé + extraction d’attributs clés (spaCy/transformers)
4. Génération de réponse (modèles: lettre, fiches, bordereau de prix)
5. Édition dans l’UI (pages React dédiées)
6. Export final (PDF/Word)

---

## Roadmap (indicative)
- [ ] Upload DAO + parsing PDF robuste (multi-colonnes, scans)
- [ ] OCR configurable (Tesseract, langues)
- [ ] Modèles de documents paramétrables (DOCX/PDF)
- [ ] Assistant de remplissage (UI guidée)
- [ ] Base de prix: import CSV/Excel, historisation, suggestions
- [ ] Tableau de bord avec KPI (taux de succès, délais moyens)
- [ ] Authentification/Autorisations (JWT, rôles)
- [ ] Connecteurs email pour envoi de notifications
- [ ] Moteur d’export batch (dossiers complets de soumission)

---
