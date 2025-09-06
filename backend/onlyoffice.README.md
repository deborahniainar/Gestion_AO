OnlyOffice Document Server — configuration rapide pour le développement local

Ce projet propose une intégration basique avec OnlyOffice utilisée pour ouvrir les documents des sous-tâches dans un éditeur externe.
Le backend attend deux variables de configuration (à définir dans `backend/.env` ou dans l'environnement) :

- ONLYOFFICE_DS_URL (ex. : http://localhost:8080)
- BACKEND_PUBLIC_URL (URL publique ou accessible par le Document Server, ex. : http://localhost:8000 ou une URL ngrok)

Configuration recommandée (Linux) :
1. Démarrer OnlyOffice Document Server via Docker :
   docker compose -f docker-compose.onlyoffice.yml up -d

2. Vérifier que le serveur est joignable :
   curl -I http://localhost:8080

3. S'assurer que le fichier `.env` du backend contient :
   ONLYOFFICE_DS_URL=http://localhost:8080
   BACKEND_PUBLIC_URL=http://localhost:8000

4. Démarrer le backend (uvicorn) et le frontend (vite). Utiliser ngrok ou un tunnel similaire si vous avez besoin d'une URL externe afin que le Document Server puisse atteindre le backend.

JWT : Le fichier docker-compose fourni désactive JWT par défaut (JWT_ENABLED=false). En production activez JWT sur le Document Server et renseignez la même clé secrète dans la configuration du backend (`ONLYOFFICE_JWT_SECRET`). Ce dépôt n'implémente pas le signing JWT complet pour les réponses de configuration OnlyOffice ; l'approche actuelle est un embed frontend simple pour les environnements de développement.
