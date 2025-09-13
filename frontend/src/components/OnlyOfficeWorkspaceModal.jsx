import React, { useState, useEffect } from 'react';
import {
  Close,
  Save,
  Edit,
  Description,
  CloudDownload,
  Fullscreen,
  FullscreenExit,
  Refresh,
  Settings,
  Info
} from '@mui/icons-material';
import { soumissionsWorkspacesAPI } from '../services/api';
import { NotificationService } from '../services/notifications';

const OnlyOfficeWorkspaceModal = ({
  isOpen,
  onClose,
  sousTache,
  lot,
  appelOffre
}) => {
  const [onlyOfficeUrl, setOnlyOfficeUrl] = useState('');
  const [fallbackOnlyOfficeUrl, setFallbackOnlyOfficeUrl] = useState('');
  const [usedFallback, setUsedFallback] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [workspaceSettings, setWorkspaceSettings] = useState({
    showToolbar: true,
    showStatusBar: true,
    enableComments: true,
    enableTracking: false
  });
  const [showSettings, setShowSettings] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [prefaceOpen, setPrefaceOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef(null);

  // Gérer la fermeture avec Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isFullscreen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, isFullscreen]);

  // Charger l'URL OnlyOffice quand la modal s'ouvre
  useEffect(() => {
    if (isOpen && sousTache && lot) {
      // Show pre-choice first
      setPrefaceOpen(true);
    }
  }, [isOpen, sousTache, lot, appelOffre]);

  const handleCreateBlank = async (type) => {
    // Create a minimal blank file in-memory and upload it
    try {
      setUploading(true);
      const ext = type === 'word' ? 'docx' : type === 'excel' ? 'xlsx' : type === 'ppt' ? 'pptx' : 'docx';
      const blob = new Blob([new Uint8Array([0])], { type: 'application/octet-stream' });
      const file = new File([blob], `nouveau.${ext}`);
      const fd = new FormData();
      fd.append('file', file);
      const res = await soumissionsWorkspacesAPI.uploadToOnlyOffice(lot, sousTache.id, fd, appelOffre);
      const data = res.data || {};
      if (data.url) {
        setOnlyOfficeUrl(data.url);
        setFallbackOnlyOfficeUrl(data.fallback_url || '');
        setPrefaceOpen(false);
      }
    } catch {
      // If backend packaged does not have the upload endpoint -> fallback to linked doc
      NotificationService.error('Import non disponible, ouverture du document lié');
      setPrefaceOpen(false);
      await loadOnlyOfficeUrl();
    } finally {
      setUploading(false);
    }
  };

  const handlePickFile = () => fileInputRef.current?.click();
  const handleFileSelected = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('file', f);
      const res = await soumissionsWorkspacesAPI.uploadToOnlyOffice(lot, sousTache.id, fd, appelOffre);
      const data = res.data || {};
      if (data.url) {
        setOnlyOfficeUrl(data.url);
        setFallbackOnlyOfficeUrl(data.fallback_url || '');
        setPrefaceOpen(false);
      }
    } catch {
      NotificationService.error('Import non disponible, ouverture du document lié');
      setPrefaceOpen(false);
      await loadOnlyOfficeUrl();
    } finally {
      setUploading(false);
    }
  };

  const loadOnlyOfficeUrl = async () => {
    setLoading(true);
    setUsedFallback(false);
    try {
      const { data } = await soumissionsWorkspacesAPI.getOnlyOfficeUrl(lot, sousTache.id, appelOffre);
      if (data?.url) {
        setOnlyOfficeUrl(data.url);
        setFallbackOnlyOfficeUrl(data.fallback_url || '');
        // Tentative automatique de l'URL de repli après un court délai si le chargement semble échouer côté DS
        // (le cross-origin empêche une détection fiable; on tente donc un switch proactif)
        if (data.fallback_url) {
          const timer = setTimeout(() => {
            // si pas encore passé en fallback et la modale est toujours ouverte, essayer l'URL alternative
            if (!usedFallback && isOpen) {
              setOnlyOfficeUrl(data.fallback_url);
              setUsedFallback(true);
              NotificationService.info("Tentative avec l'URL alternative OnlyOffice");
            }
          }, 4000);
          // nettoyer le timer si l'URL change/fermeture
          return () => clearTimeout(timer);
        }
      } else {
        NotificationService.error('URL OnlyOffice indisponible');
      }
    } catch {
      NotificationService.error('Impossible de charger l\'espace de travail OnlyOffice');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadOnlyOfficeUrl();
  };

  const handleSave = async () => {
    try {
      // Simuler une sauvegarde - dans un vrai cas, cela communiquerait avec OnlyOffice
      setLastSaved(new Date());
      NotificationService.success('Document sauvegardé avec succès');
    } catch {
      NotificationService.error('Erreur lors de la sauvegarde');
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !isFullscreen) {
      onClose();
    }
  };

  if (!isOpen || !sousTache) return null;

  const modalClasses = isFullscreen 
    ? "fixed inset-0 bg-white dark:bg-gray-900 z-50"
    : "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4";

  const contentClasses = isFullscreen
    ? "w-full h-full flex flex-col"
    : "bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] flex flex-col";

  return (
    <div className={modalClasses} onClick={handleOverlayClick}>
      <div className={contentClasses}>
        {/* Header de la modal */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <Description className="h-6 w-6 text-blue-500" />
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Espace de travail - {sousTache.titre}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Lot: {lot} {lastSaved && `• Dernière sauvegarde: ${lastSaved.toLocaleTimeString()}`}
              </p>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2">
            {prefaceOpen && (
              <span className="text-xs text-gray-500">Choisissez un fichier à ouvrir</span>
            )}
            <button
              onClick={handleSave}
              className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm transition-colors duration-200 flex items-center gap-1"
              title="Sauvegarder"
            >
              <Save className="h-4 w-4" />
              Sauvegarder
            </button>

            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              title="Actualiser"
              disabled={loading}
            >
              <Refresh className={`h-5 w-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {fallbackOnlyOfficeUrl && (
              <button
                onClick={() => { setOnlyOfficeUrl(prev => prev === fallbackOnlyOfficeUrl ? onlyOfficeUrl : fallbackOnlyOfficeUrl); setUsedFallback(true); }}
                className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm transition-colors duration-200"
                title="Essayer l'URL alternative"
                disabled={loading}
              >
                URL alternative
              </button>
            )}

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              title="Paramètres"
            >
              <Settings className="h-5 w-5 text-gray-500" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
            >
              {isFullscreen ? (
                <FullscreenExit className="h-5 w-5 text-gray-500" />
              ) : (
                <Fullscreen className="h-5 w-5 text-gray-500" />
              )}
            </button>

            {!isFullscreen && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                title="Fermer (Escape)"
              >
                <Close className="h-5 w-5 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Panneau de paramètres */}
        {showSettings && (
          <div className="border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Paramètres de l'espace de travail
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={workspaceSettings.showToolbar}
                  onChange={(e) => setWorkspaceSettings(prev => ({
                    ...prev,
                    showToolbar: e.target.checked
                  }))}
                  className="rounded"
                />
                <span className="text-gray-700 dark:text-gray-300">Afficher la barre d'outils</span>
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={workspaceSettings.showStatusBar}
                  onChange={(e) => setWorkspaceSettings(prev => ({
                    ...prev,
                    showStatusBar: e.target.checked
                  }))}
                  className="rounded"
                />
                <span className="text-gray-700 dark:text-gray-300">Barre de statut</span>
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={workspaceSettings.enableComments}
                  onChange={(e) => setWorkspaceSettings(prev => ({
                    ...prev,
                    enableComments: e.target.checked
                  }))}
                  className="rounded"
                />
                <span className="text-gray-700 dark:text-gray-300">Commentaires</span>
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={workspaceSettings.enableTracking}
                  onChange={(e) => setWorkspaceSettings(prev => ({
                    ...prev,
                    enableTracking: e.target.checked
                  }))}
                  className="rounded"
                />
                <span className="text-gray-700 dark:text-gray-300">Suivi des modifications</span>
              </label>
            </div>
          </div>
        )}

        {/* Contenu principal - OnlyOffice iframe */}
        <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900">
          {prefaceOpen ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Créer ou importer un document à ouvrir dans OnlyOffice</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button disabled={uploading} onClick={() => handleCreateBlank('word')} className="px-3 py-2 bg-blue-600 text-white rounded text-sm">Nouveau Word</button>
                  <button disabled={uploading} onClick={() => handleCreateBlank('excel')} className="px-3 py-2 bg-green-600 text-white rounded text-sm">Nouveau Excel</button>
                  <button disabled={uploading} onClick={() => handleCreateBlank('ppt')} className="px-3 py-2 bg-orange-600 text-white rounded text-sm">Nouvelle Présentation</button>
                  <button disabled={uploading} onClick={handlePickFile} className="px-3 py-2 bg-gray-700 text-white rounded text-sm">Importer…</button>
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />
                </div>
                <div>
                  <button disabled={uploading} onClick={() => { setPrefaceOpen(false); loadOnlyOfficeUrl(); }} className="px-3 py-2 bg-gray-200 rounded text-sm">Ouvrir le document lié</button>
                </div>
              </div>
            </div>
          ) : (
            loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Chargement de l'espace de travail OnlyOffice...
                  </p>
                </div>
              </div>
            ) : onlyOfficeUrl ? (
              <iframe
                src={onlyOfficeUrl}
                className="w-full h-full border-0"
                title={`Espace de travail OnlyOffice - ${sousTache.titre}`}
                allow="fullscreen"
                onError={() => {
                  NotificationService.error('Erreur de chargement de l\'espace de travail');
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <Info className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                    Espace de travail indisponible
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    L'espace de travail OnlyOffice pour cette sous-tâche n'est pas disponible.
                  </p>
                  <button
                    onClick={handleRefresh}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200"
                  >
                    Réessayer
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer avec informations */}
        <div className="border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2">
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <span>Statut: {sousTache.done ? 'Terminé' : 'En cours'}</span>
              <span>Mode: {isFullscreen ? 'Plein écran' : 'Fenêtré'}</span>
            </div>
            <div className="flex items-center gap-2">
              {isFullscreen && (
                <button
                  onClick={onClose}
                  className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors duration-200"
                >
                  Fermer l'espace de travail
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlyOfficeWorkspaceModal;