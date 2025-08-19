import { toast } from 'react-toastify';

// Configuration par défaut pour les toasts
const defaultConfig = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

// Service de notifications centralisé
export const NotificationService = {
  // Succès
  success: (message, config = {}) => {
    toast.success(message, { ...defaultConfig, ...config });
  },

  // Erreur
  error: (message, config = {}) => {
    toast.error(message, { ...defaultConfig, ...config });
  },

  // Information
  info: (message, config = {}) => {
    toast.info(message, { ...defaultConfig, ...config });
  },

  // Avertissement
  warning: (message, config = {}) => {
    toast.warning(message, { ...defaultConfig, ...config });
  },

  // Notification personnalisée
  custom: (message, type = 'info', config = {}) => {
    toast[type](message, { ...defaultConfig, ...config });
  },

  // Notification de chargement
  loading: (message, config = {}) => {
    return toast.loading(message, { ...defaultConfig, ...config });
  },

  // Mettre à jour une notification de chargement
  update: (toastId, message, type = 'success', config = {}) => {
    toast.update(toastId, {
      render: message,
      type: type,
      isLoading: false,
      ...config
    });
  },

  // Dismiss une notification
  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },

  // Dismiss toutes les notifications
  dismissAll: () => {
    toast.dismiss();
  }
};

// Messages prédéfinis pour les opérations courantes
export const NotificationMessages = {
  // CRUD Operations
  create: {
    success: "Élément créé avec succès",
    error: "Erreur lors de la création",
    loading: "Création en cours..."
  },
  update: {
    success: "Élément mis à jour avec succès",
    error: "Erreur lors de la mise à jour",
    loading: "Mise à jour en cours..."
  },
  delete: {
    success: "Élément supprimé avec succès",
    error: "Erreur lors de la suppression",
    loading: "Suppression en cours..."
  },
  fetch: {
    success: "Données récupérées avec succès",
    error: "Erreur lors de la récupération des données",
    loading: "Chargement en cours..."
  },

  // Authentification
  auth: {
    login: {
      success: "Connexion réussie",
      error: "Erreur de connexion"
    },
    logout: {
      success: "Déconnexion réussie",
      error: "Erreur lors de la déconnexion"
    }
  },

  // Fichiers
  file: {
    upload: {
      success: "Fichier téléchargé avec succès",
      error: "Erreur lors du téléchargement",
      loading: "Téléchargement en cours..."
    },
    download: {
      success: "Téléchargement réussi",
      error: "Erreur lors du téléchargement",
      loading: "Téléchargement en cours..."
    }
  },

  // Générique
  generic: {
    success: "Opération réussie",
    error: "Une erreur s'est produite",
    warning: "Attention",
    info: "Information"
  }
};

export default NotificationService;
