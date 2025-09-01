import React from 'react';
import { Close, CloudDownload, AttachFile } from '@mui/icons-material';

const DocumentViewer = ({ 
  isOpen, 
  document: docData, 
  onClose 
}) => {
  // Fonction pour déterminer le type de fichier
  const getFileType = (filename) => {
    if (!filename) return 'unknown';
    const extension = filename.split('.').pop().toLowerCase();
    
    if (['pdf'].includes(extension)) return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
    if (['doc', 'docx'].includes(extension)) return 'word';
    if (['xls', 'xlsx'].includes(extension)) return 'excel';
    if (['ppt', 'pptx'].includes(extension)) return 'powerpoint';
    if (['txt'].includes(extension)) return 'text';
    if (['zip', 'rar', '7z'].includes(extension)) return 'archive';
    
    return 'unknown';
  };

  // Gérer la fermeture avec Escape
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Empêcher le scroll du body
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Ne pas afficher si pas ouvert ou pas de document
  if (!isOpen || !docData) return null;

  const fileType = getFileType(docData.filename || docData.original_filename);
  const fileName = docData.original_filename || docData.filename || 'Document sans nom';
  const fileUrl = docData.url;

  // Gérer le clic sur l'overlay
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Mapper les types de fichiers vers des couleurs d'icônes
  const getTypeColor = (type) => {
    switch (type) {
      case 'pdf': return 'text-red-500';
      case 'image': return 'text-green-500';
      case 'word': return 'text-blue-500';
      case 'excel': return 'text-green-600';
      case 'powerpoint': return 'text-orange-500';
      case 'text': return 'text-gray-500';
      case 'archive': return 'text-purple-500';
      default: return 'text-gray-400';
    }
  };

  // Obtenir une description du type de fichier
  const getTypeDescription = (type) => {
    switch (type) {
      case 'pdf': return 'Document PDF';
      case 'image': return 'Image';
      case 'word': return 'Document Word';
      case 'excel': return 'Feuille de calcul Excel';
      case 'powerpoint': return 'Présentation PowerPoint';
      case 'text': return 'Fichier texte';
      case 'archive': return 'Archive compressée';
      default: return 'Fichier';
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[95vh] flex flex-col">
        {/* Header de la modal */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-3">
            <AttachFile className={`h-6 w-6 ${getTypeColor(fileType)}`} />
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {fileName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getTypeDescription(fileType)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={fileUrl}
              download={fileName}
              className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm transition-colors duration-200"
              title="Télécharger le document"
            >
              <CloudDownload className="h-4 w-4 inline mr-1" />
              Télécharger
            </a>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              title="Fermer (Escape)"
            >
              <Close className="h-6 w-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Contenu de la modal */}
        <div className="flex-1 overflow-auto">
          {fileType === 'pdf' && (
            <div className="h-full">
              <iframe
                src={fileUrl}
                className="w-full h-full min-h-[700px] border-0"
                title={`Aperçu de ${fileName}`}
              />
            </div>
          )}
          
          {fileType === 'image' && (
            <div className="flex justify-center items-center p-4">
              <img
                src={fileUrl}
                alt={fileName}
                className="max-w-full max-h-full object-contain rounded shadow-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="hidden text-center">
                <p className="text-red-500">Erreur de chargement de l'image</p>
              </div>
            </div>
          )}
          
          {fileType === 'text' && (
            <div className="p-4">
              <iframe
                src={fileUrl}
                className="w-full h-96 border rounded"
                title={`Contenu de ${fileName}`}
              />
            </div>
          )}
          
          {(['word', 'excel', 'powerpoint', 'archive', 'unknown'].includes(fileType)) && (
            <div className="text-center py-16 px-8">
              <div className="mb-6">
                <AttachFile className={`h-20 w-20 mx-auto ${getTypeColor(fileType)}`} />
              </div>
              <h4 className="text-2xl font-medium text-gray-900 dark:text-white mb-3">
                Aperçu non disponible
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {fileType === 'word' && "Les documents Word ne peuvent pas être prévisualisés dans le navigateur."}
                {fileType === 'excel' && "Les feuilles de calcul Excel ne peuvent pas être prévisualisées dans le navigateur."}
                {fileType === 'powerpoint' && "Les présentations PowerPoint ne peuvent pas être prévisualisées dans le navigateur."}
                {fileType === 'archive' && "Les archives compressées ne peuvent pas être prévisualisées dans le navigateur."}
                {fileType === 'unknown' && "Ce type de fichier ne peut pas être prévisualisé dans le navigateur."}
              </p>
              
              {/* Informations du fichier */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 max-w-md mx-auto">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Nom:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{fileName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Type:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{getTypeDescription(fileType)}</span>
                  </div>
                  {docData.created_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Date:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(docData.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <a
                  href={fileUrl}
                  download={fileName}
                  className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                >
                  <CloudDownload className="h-5 w-5 mr-2" />
                  Télécharger pour l'ouvrir
                </a>
                
                <p className="text-xs text-gray-500">
                  Le fichier s'ouvrira dans l'application appropriée de votre système
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
