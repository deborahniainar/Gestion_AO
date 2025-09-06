# Système de Notifications avec React-Toastify

Ce projet utilise React-Toastify pour gérer toutes les notifications utilisateur de manière centralisée et cohérente.

## Installation

Les dépendances sont déjà installées :
```bash
npm install react-toastify
```

## Structure des fichiers

- `src/services/notifications.js` - Service centralisé pour les notifications
- `src/hooks/useNotifications.js` - Hook personnalisé pour faciliter l'utilisation
- `src/services/api.js` - Intégration avec les appels API
- `src/App.jsx` - Configuration du ToastContainer
- `src/index.css` - Styles personnalisés pour les notifications

## Utilisation

### 1. Hook useNotifications (Recommandé)

```jsx
import useNotifications from '../hooks/useNotifications';

const MyComponent = () => {
  const { 
    showSuccess, 
    showError, 
    showInfo, 
    showWarning,
    showCreateSuccess,
    showLoginSuccess,
    showLoading,
    updateLoading 
  } = useNotifications();

  const handleSubmit = async () => {
    const loadingToast = showLoading('Traitement en cours...');
    
    try {
      // Votre logique ici
      await someAsyncOperation();
      updateLoading(loadingToast, 'Opération réussie !', 'success');
    } catch (error) {
      updateLoading(loadingToast, 'Erreur lors du traitement', 'error');
    }
  };

  return (
    <div>
      <button onClick={() => showSuccess('Opération réussie !')}>
        Succès
      </button>
      <button onClick={() => showError('Une erreur s\'est produite')}>
        Erreur
      </button>
      <button onClick={() => showInfo('Information importante')}>
        Info
      </button>
      <button onClick={() => showWarning('Attention !')}>
        Warning
      </button>
    </div>
  );
};
```

### 2. Service direct

```jsx
import { NotificationService, NotificationMessages } from '../services/notifications';

// Notifications de base
NotificationService.success('Opération réussie !');
NotificationService.error('Une erreur s\'est produite');
NotificationService.info('Information importante');
NotificationService.warning('Attention !');

// Notifications prédéfinies
NotificationService.success(NotificationMessages.create.success);
NotificationService.error(NotificationMessages.delete.error);

// Notifications de chargement
const loadingToast = NotificationService.loading('Chargement...');
// Plus tard...
NotificationService.update(loadingToast, 'Terminé !', 'success');
```

### 3. Intégration avec les appels API

```jsx
import { apiWithNotifications } from '../services/api';

// Les notifications sont automatiquement gérées
const fetchData = async () => {
  try {
    const response = await apiWithNotifications.get('/users');
    return response.data;
  } catch (error) {
    // L'erreur est automatiquement affichée
    console.error(error);
  }
};

const createUser = async (userData) => {
  try {
    const response = await apiWithNotifications.post('/users', userData);
    return response.data;
  } catch (error) {
    // L'erreur est automatiquement affichée
    console.error(error);
  }
};
```

## Types de notifications disponibles

### Notifications de base
- `showSuccess(message)` - Notification de succès (vert)
- `showError(message)` - Notification d'erreur (rouge)
- `showInfo(message)` - Notification d'information (bleu)
- `showWarning(message)` - Notification d'avertissement (jaune)

### Notifications CRUD
- `showCreateSuccess()` - Création réussie
- `showCreateError(error)` - Erreur de création
- `showUpdateSuccess()` - Mise à jour réussie
- `showUpdateError(error)` - Erreur de mise à jour
- `showDeleteSuccess()` - Suppression réussie
- `showDeleteError(error)` - Erreur de suppression
- `showFetchSuccess()` - Récupération réussie
- `showFetchError(error)` - Erreur de récupération

### Notifications d'authentification
- `showLoginSuccess()` - Connexion réussie
- `showLoginError(error)` - Erreur de connexion
- `showLogoutSuccess()` - Déconnexion réussie
- `showLogoutError(error)` - Erreur de déconnexion

### Notifications de fichiers
- `showUploadSuccess()` - Téléchargement réussi
- `showUploadError(error)` - Erreur de téléchargement
- `showDownloadSuccess()` - Téléchargement réussi
- `showDownloadError(error)` - Erreur de téléchargement

### Notifications de chargement
- `showLoading(message)` - Affiche une notification de chargement
- `updateLoading(toastId, message, type)` - Met à jour une notification de chargement

## Configuration

### Position des notifications
Par défaut : `top-right`

### Durée d'affichage
Par défaut : `5000ms` (5 secondes)

### Personnalisation
Vous pouvez personnaliser les notifications en passant un objet de configuration :

```jsx
showSuccess('Message', {
  position: 'bottom-center',
  autoClose: 3000,
  hideProgressBar: true
});
```

## Styles personnalisés

Les notifications utilisent des styles personnalisés définis dans `src/index.css` :

- **Succès** : Gradient vert
- **Erreur** : Gradient rouge
- **Information** : Gradient bleu
- **Avertissement** : Gradient jaune

## Exemples d'utilisation dans le projet

### Page de connexion
```jsx
const handleLogin = async () => {
  const loadingToast = showLoading('Connexion en cours...');
  
  try {
    await loginAPI(credentials);
    updateLoading(loadingToast, 'Connexion réussie !', 'success');
    showLoginSuccess();
  } catch (error) {
    updateLoading(loadingToast, 'Erreur de connexion', 'error');
    showLoginError(error.message);
  }
};
```

### Gestion des formulaires
```jsx
const handleSubmit = async (formData) => {
  const loadingToast = showLoading('Enregistrement en cours...');
  
  try {
    await saveData(formData);
    updateLoading(loadingToast, 'Données enregistrées !', 'success');
    showCreateSuccess();
  } catch (error) {
    updateLoading(loadingToast, 'Erreur d\'enregistrement', 'error');
    showCreateError(error.message);
  }
};
```

## Bonnes pratiques

1. **Utilisez le hook `useNotifications`** pour une meilleure organisation
2. **Utilisez les messages prédéfinis** pour la cohérence
3. **Gérez les états de chargement** avec `showLoading` et `updateLoading`
4. **Personnalisez les messages d'erreur** pour être plus spécifiques
5. **Évitez les notifications redondantes** dans les intercepteurs API

## Support

Pour toute question ou problème avec le système de notifications, consultez la documentation officielle de React-Toastify : https://fkhadra.github.io/react-toastify/
