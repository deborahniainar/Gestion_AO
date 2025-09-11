import axios from 'axios'
import { NotificationService } from './notifications'

// Configuration centralisée de l'API
// En mode Electron, toujours utiliser localhost:8000
// En mode web (développement), utiliser l'URL relative /api  
const API_BASE_URL = window?.electronAPI ? 'http://127.0.0.1:8000/api' : '/api'

// Fonction utilitaire pour construire les URLs d'uploads
export const buildUploadUrl = (path) => {
  if (!path) return null
  // Si c'est déjà une URL complète, la retourner telle quelle
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  
  const baseUrl = window?.electronAPI ? 'http://127.0.0.1:8000' : ''
  
  // Si le chemin commence déjà par /api ou /uploads, l'utiliser tel quel
  if (path.startsWith('/api/') || path.startsWith('/uploads/')) {
    return `${baseUrl}${path}`
  }
  
  // Sinon, construire le chemin complet
  return `${baseUrl}/api/uploads/${path}`
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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

// API pour la gestion des personnels
export const personnelsAPI = {
  getAll: () => api.get('/personnels/'),
  getById: (id) => api.get(`/personnels/${id}`),
  create: (data) => api.post('/personnels/', data),
  createWithFiles: (formData) => api.post('/personnels/with-files', formData),
  update: (id, data) => api.put(`/personnels/${id}`, data),
  updateWithFiles: (id, formData) => api.put(`/personnels/${id}/with-files`, formData),
  delete: (id) => api.delete(`/personnels/${id}`),
  getDocuments: (id) => api.get(`/personnels/${id}/documents`),
  deleteDocument: (personnelId, docId) => api.delete(`/personnels/${personnelId}/documents/${docId}`),
}

// API pour la gestion des matériels
export const materielsAPI = {
  getAll: () => api.get('/materiels/'),
  getById: (id) => api.get(`/materiels/${id}`),
  create: (data) => api.post('/materiels/', data),
  createWithFiles: (formData) => api.post('/materiels/with-files', formData),
  update: (id, data) => api.put(`/materiels/${id}`, data),
  updateWithFiles: (id, formData) => api.put(`/materiels/${id}/with-files`, formData),
  delete: (id) => api.delete(`/materiels/${id}`),
  getDocuments: (id) => api.get(`/materiels/${id}/documents`),
  deleteDocument: (materielId, docId) => api.delete(`/materiels/${materielId}/documents/${docId}`),
}

// API d'authentification
export const authAPI = {
  login: async (credentials) => {
    const formData = new URLSearchParams(credentials);
    return api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },
  logout: () => {
    localStorage.removeItem('token');
    return Promise.resolve();
  },
  getProfile: () => api.get('/auth/me'),
}

export default api

export const soumissionsWorkspacesAPI = {
  listLots: (appelOffre) => api.get(`/soumissions/workspaces/`, { params: { appel_offre: appelOffre || 'default' } }),
  getWorkspace: (lot, appelOffre, opts = {}) => api.get(`/soumissions/workspaces/${encodeURIComponent(lot)}`, { params: { appel_offre: appelOffre || 'default', create_if_missing: !!opts.createIfMissing } }),
  saveWorkspace: (lot, data, appelOffre) => api.put(`/soumissions/workspaces/${encodeURIComponent(lot)}`, data, { params: { appel_offre: appelOffre || 'default' } }),
  deleteWorkspace: (lot, appelOffre) => api.delete(`/soumissions/workspaces/${encodeURIComponent(lot)}`, { params: { appel_offre: appelOffre || 'default' } }),
  getSubtask: (lot, subId, appelOffre) => api.get(`/soumissions/workspaces/${encodeURIComponent(lot)}/subtasks/${encodeURIComponent(subId)}`, { params: { appel_offre: appelOffre || 'default' } }),
  saveSubtask: (lot, subId, data, appelOffre) => api.put(`/soumissions/workspaces/${encodeURIComponent(lot)}/subtasks/${encodeURIComponent(subId)}`, data, { params: { appel_offre: appelOffre || 'default' } }),
  exportFinished: (lot, appelOffre) => api.post(`/soumissions/workspaces/${encodeURIComponent(lot)}/export_finished`, null, { params: { appel_offre: appelOffre || 'default' }, responseType: 'blob' }),
  getOnlyOfficeUrl: (lot, subId, appelOffre) => api.get(`/soumissions/workspaces/${encodeURIComponent(lot)}/subtasks/${encodeURIComponent(subId)}/onlyoffice_url`, { params: { appel_offre: appelOffre || 'default' } }),
}
