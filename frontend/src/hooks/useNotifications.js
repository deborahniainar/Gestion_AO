import { useCallback } from 'react';
import { NotificationService, NotificationMessages } from '../services/notifications';

export const useNotifications = () => {
  // Notifications de base
  const showSuccess = useCallback((message) => {
    NotificationService.success(message);
  }, []);

  const showError = useCallback((message) => {
    NotificationService.error(message);
  }, []);

  const showInfo = useCallback((message) => {
    NotificationService.info(message);
  }, []);

  const showWarning = useCallback((message) => {
    NotificationService.warning(message);
  }, []);

  // Notifications pour les opérations CRUD
  const showCreateSuccess = useCallback(() => {
    NotificationService.success(NotificationMessages.create.success);
  }, []);

  const showCreateError = useCallback((error) => {
    NotificationService.error(error || NotificationMessages.create.error);
  }, []);

  const showUpdateSuccess = useCallback(() => {
    NotificationService.success(NotificationMessages.update.success);
  }, []);

  const showUpdateError = useCallback((error) => {
    NotificationService.error(error || NotificationMessages.update.error);
  }, []);

  const showDeleteSuccess = useCallback(() => {
    NotificationService.success(NotificationMessages.delete.success);
  }, []);

  const showDeleteError = useCallback((error) => {
    NotificationService.error(error || NotificationMessages.delete.error);
  }, []);

  const showFetchSuccess = useCallback(() => {
    NotificationService.success(NotificationMessages.fetch.success);
  }, []);

  const showFetchError = useCallback((error) => {
    NotificationService.error(error || NotificationMessages.fetch.error);
  }, []);

  // Notifications pour l'authentification
  const showLoginSuccess = useCallback(() => {
    NotificationService.success(NotificationMessages.auth.login.success);
  }, []);

  const showLoginError = useCallback((error) => {
    NotificationService.error(error || NotificationMessages.auth.login.error);
  }, []);

  const showLogoutSuccess = useCallback(() => {
    NotificationService.success(NotificationMessages.auth.logout.success);
  }, []);

  const showLogoutError = useCallback((error) => {
    NotificationService.error(error || NotificationMessages.auth.logout.error);
  }, []);

  // Notifications pour les fichiers
  const showUploadSuccess = useCallback(() => {
    NotificationService.success(NotificationMessages.file.upload.success);
  }, []);

  const showUploadError = useCallback((error) => {
    NotificationService.error(error || NotificationMessages.file.upload.error);
  }, []);

  const showDownloadSuccess = useCallback(() => {
    NotificationService.success(NotificationMessages.file.download.success);
  }, []);

  const showDownloadError = useCallback((error) => {
    NotificationService.error(error || NotificationMessages.file.download.error);
  }, []);

  // Notifications de chargement
  const showLoading = useCallback((message) => {
    return NotificationService.loading(message);
  }, []);

  const updateLoading = useCallback((toastId, message, type = 'success') => {
    NotificationService.update(toastId, message, type);
  }, []);

  // Notifications personnalisées
  const showCustom = useCallback((message, type = 'info', config = {}) => {
    NotificationService.custom(message, type, config);
  }, []);

  // Utilitaires
  const dismiss = useCallback((toastId) => {
    NotificationService.dismiss(toastId);
  }, []);

  const dismissAll = useCallback(() => {
    NotificationService.dismissAll();
  }, []);

  return {
    // Notifications de base
    showSuccess,
    showError,
    showInfo,
    showWarning,
    
    // Notifications CRUD
    showCreateSuccess,
    showCreateError,
    showUpdateSuccess,
    showUpdateError,
    showDeleteSuccess,
    showDeleteError,
    showFetchSuccess,
    showFetchError,
    
    // Notifications d'authentification
    showLoginSuccess,
    showLoginError,
    showLogoutSuccess,
    showLogoutError,
    
    // Notifications de fichiers
    showUploadSuccess,
    showUploadError,
    showDownloadSuccess,
    showDownloadError,
    
    // Notifications de chargement
    showLoading,
    updateLoading,
    
    // Notifications personnalisées
    showCustom,
    
    // Utilitaires
    dismiss,
    dismissAll
  };
};

export default useNotifications;
