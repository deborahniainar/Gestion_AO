# React + Vite

Ce modèle fournit une configuration minimale pour faire fonctionner React avec Vite, avec HMR (Hot Module Replacement) et quelques règles ESLint.

Actuellement, deux plugins officiels sont disponibles :

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) utilise [Babel](https://babeljs.io/) pour le Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) utilise [SWC](https://swc.rs/) pour le Fast Refresh

## Étendre la configuration ESLint

Si vous développez une application de production, nous recommandons d'utiliser TypeScript avec des règles de linting basées sur les types activées. Consultez le [modèle TS](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) pour savoir comment intégrer TypeScript et [`typescript-eslint`](https://typescript-eslint.io) dans votre projet.
