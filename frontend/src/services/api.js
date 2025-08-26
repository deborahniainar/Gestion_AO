import axios from 'axios'
import { NotificationService } from './notifications'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Intercepteur pour gérer les erreurs d'authentification et les notifications
api.interceptors.response.use(
  (response) => {
    // Notification de succès pour les opérations POST, PUT, DELETE
    const method = response.config.method?.toUpperCase()
    if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
      const url = response.config.url
      
      // Déterminer le type d'opération basé sur l'URL
      if (url.includes('/create') || method === 'POST') {
        NotificationService.success('Élément créé avec succès')
      } else if (url.includes('/update') || method === 'PUT') {
        NotificationService.success('Élément mis à jour avec succès')
      } else if (url.includes('/delete') || method === 'DELETE') {
        NotificationService.success('Élément supprimé avec succès')
      }
    }
    
    return response
  },
  (error) => {
    // Gestion des erreurs avec notifications
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      NotificationService.error('Session expirée. Veuillez vous reconnecter.')
      window.location.href = '/login'
    } else if (error.response?.status === 403) {
      NotificationService.error('Accès refusé. Vous n\'avez pas les permissions nécessaires.')
    } else if (error.response?.status === 404) {
      NotificationService.error('Ressource non trouvée.')
    } else if (error.response?.status === 500) {
      NotificationService.error('Erreur serveur. Veuillez réessayer plus tard.')
    } else if (error.response?.data?.detail) {
      NotificationService.error(error.response.data.detail)
    } else if (error.message === 'Network Error') {
      NotificationService.error('Erreur de connexion. Vérifiez votre connexion réseau.')
    } else {
      NotificationService.error('Une erreur inattendue s\'est produite.')
    }
    
    return Promise.reject(error)
  }
)

// Fonctions utilitaires pour les appels API avec notifications
export const apiWithNotifications = {
  // GET avec notification de chargement
  get: async (url, config = {}) => {
    const loadingToast = NotificationService.loading('Chargement en cours...')
    try {
      const response = await api.get(url, config)
      NotificationService.update(loadingToast, 'Données récupérées avec succès', 'success')
      return response
    } catch (error) {
      NotificationService.update(loadingToast, 'Erreur lors du chargement', 'error')
      throw error
    }
  },

  // POST avec notification de chargement
  post: async (url, data, config = {}) => {
    const loadingToast = NotificationService.loading('Création en cours...')
    try {
      const response = await api.post(url, data, config)
      NotificationService.update(loadingToast, 'Élément créé avec succès', 'success')
      return response
    } catch (error) {
      NotificationService.update(loadingToast, 'Erreur lors de la création', 'error')
      throw error
    }
  },

  // PUT avec notification de chargement
  put: async (url, data, config = {}) => {
    const loadingToast = NotificationService.loading('Mise à jour en cours...')
    try {
      const response = await api.put(url, data, config)
      NotificationService.update(loadingToast, 'Élément mis à jour avec succès', 'success')
      return response
    } catch (error) {
      NotificationService.update(loadingToast, 'Erreur lors de la mise à jour', 'error')
      throw error
    }
  },

  // DELETE avec notification de chargement
  delete: async (url, config = {}) => {
    const loadingToast = NotificationService.loading('Suppression en cours...')
    try {
      const response = await api.delete(url, config)
      NotificationService.update(loadingToast, 'Élément supprimé avec succès', 'success')
      return response
    } catch (error) {
      NotificationService.update(loadingToast, 'Erreur lors de la suppression', 'error')
      throw error
    }
  }
}

export const documentsAPI = {
  getAll: () => api.get('/documents/'),
  create: (formData) => api.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  update: (id, data) => api.put(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`),
  download: (id) => api.get(`/documents/download/${id}`, {
    responseType: 'blob',
  }),
}

export default api
