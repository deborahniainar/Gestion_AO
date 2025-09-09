# Application Electron - Gestion AO

Cette application desktop est basée sur votre projet web FastAPI/React et utilise Electron pour créer une expérience native.

## Scripts disponibles

### Développement
```bash
npm run electron:dev
```
Lance le serveur de développement Vite et l'application Electron en parallèle.

### Build et empaquetage
```bash
# Build simple (dossier non-empaqueté)
npm run electron:pack

# Distribution complète (installateur)
npm run electron:dist

# Distribution spécifique par plateforme
npm run electron:dist-win    # Windows
npm run electron:dist-mac    # macOS
npm run electron:dist-linux  # Linux
```

## Prérequis

1. **Backend FastAPI** : Assurez-vous que votre backend FastAPI fonctionne sur `http://localhost:8000`
2. **Node.js** : Version 16 ou supérieure
3. **Dépendances** : Toutes les dépendances sont installées via `npm install`

## Architecture

- `electron/main.js` : Processus principal Electron
- `electron/preload.js` : Script de sécurité pour la communication inter-processus
- `dist/` : Build de production de l'application React
- `dist-electron/` : Fichiers de distribution Electron

## Fonctionnalités

- ✅ Interface native avec menus
- ✅ Splash screen au démarrage
- ✅ Gestion sécurisée des dialogues (fichiers, messages)
- ✅ Support des raccourcis clavier
- ✅ Auto-updater prêt (configuration requise)
- ✅ Icônes et branding personnalisés

## Configuration backend

L'application Electron utilise les mêmes endpoints que votre application web. Assurez-vous que :

1. Votre backend FastAPI accepte les requêtes depuis `http://localhost:5173` (dev) ou `file://` (prod)
2. Les CORS sont configurés correctement
3. Les uploads de fichiers fonctionnent avec les chemins relatifs

## Personnalisation

- **Icône** : Remplacez `public/Logo-STC.png` par votre icône
- **Nom d'application** : Modifiez `productName` dans `package.json`
- **Fenêtre** : Ajustez les dimensions dans `electron/main.js`
- **Menu** : Personnalisez le menu dans la fonction `createMenu()`

## Déploiement

L'application génère :
- **Windows** : Installateur NSIS (.exe)
- **macOS** : Image disque (.dmg)
- **Linux** : AppImage (.AppImage)

Les fichiers de distribution sont créés dans `dist-electron/`.
