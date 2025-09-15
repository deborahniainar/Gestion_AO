import { useState } from 'react';
import OnlyOfficeWorkspaceModal from './components/OnlyOfficeWorkspaceModal';
import { Work, Description, Edit, Delete } from '@mui/icons-material';

const SoumissionsWorkspacePreview = () => {
  const [workspaceModal, setWorkspaceModal] = useState({
    open: false,
    sousTache: null
  });

  // Mock data for preview
  const mockSousTache = {
    id: 'subtask-1',
    titre: 'Page de garde Technique',
    done: false
  };

  const mockLot = 'Lot 1 - Construction';
  const mockAppelOffre = 'DAO-2024-001';

  const handleOpenWorkspace = () => {
    setWorkspaceModal({
      open: true,
      sousTache: mockSousTache
    });
  };

  const handleCloseWorkspace = () => {
    setWorkspaceModal({
      open: false,
      sousTache: null
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Aperçu - Espace d'édition (TinyMCE) pour Soumissions
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Fonctionnalités de l'éditeur
          </h2>
          <ul className="space-y-2 text-gray-600 mb-6">
            <li className="flex items-center gap-2">
              <Work className="h-5 w-5 text-blue-500" />
              Interface TinyMCE intégrée dans une modal
            </li>
            <li className="flex items-center gap-2">
              <Description className="h-5 w-5 text-green-500" />
              Espace d'édition pour chaque sous-tâche
            </li>
            <li className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-orange-500" />
              Paramètres éditoriaux
            </li>
            <li className="flex items-center gap-2">
              <Delete className="h-5 w-5 text-purple-500" />
              Mode plein écran disponible
            </li>
          </ul>
          
          <button
            onClick={handleOpenWorkspace}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
          >
            <Work className="h-5 w-5" />
            Ouvrir l'espace d'édition
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Simulation d'une sous-tâche
          </h2>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={mockSousTache.done}
                  readOnly
                  className="h-4 w-4 accent-blue-500"
                />
                <span className="text-gray-800 font-medium">
                  {mockSousTache.titre}
                </span>
              </div>
              <button
                onClick={handleOpenWorkspace}
                className="inline-flex items-center justify-center h-8 w-8 rounded hover:bg-blue-100 text-blue-600 transition-colors"
                title="Ouvrir l'espace d'édition"
              >
                <Work fontSize="small" />
              </button>
            </div>
          </div>
        </div>

        {/* OnlyOffice Workspace Modal */}
        <OnlyOfficeWorkspaceModal
          isOpen={workspaceModal.open}
          onClose={handleCloseWorkspace}
          sousTache={workspaceModal.sousTache}
          lot={mockLot}
          appelOffre={mockAppelOffre}
        />
      </div>
    </div>
  );
};

export default SoumissionsWorkspacePreview;