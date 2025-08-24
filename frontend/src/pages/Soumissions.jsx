import React from 'react'
import Sidebar from '../components/Sidebar'
import { NotificationService, NotificationMessages } from '../services/notifications'
import {
  CloudDownload,
  Help,
  Add,
  Description,
  Edit, 
  Delete
} from "@mui/icons-material";

const Soumissions = () => {
  // Exemples de fonctions pour démontrer les notifications
  const handleDownload = () => {
    const loadingToast = NotificationService.loading(NotificationMessages.file.download.loading);
    
    // Simuler un téléchargement
    setTimeout(() => {
      NotificationService.update(loadingToast, NotificationMessages.file.download.success, 'success');
    }, 2000);
  };

  const handleAdd = () => {
    NotificationService.success(NotificationMessages.create.success);
  };

  const handleEdit = () => {
    NotificationService.info("Mode édition activé");
  };

  const handleDelete = () => {
    NotificationService.warning("Êtes-vous sûr de vouloir supprimer cet élément ?");
  };

  const handleError = () => {
    NotificationService.error(NotificationMessages.generic.error);
  };

  return (
    <div className='flex min-h-screen bg-main dark:bg-primary overflow-y-auto transition-all duration-200 ease-in-out'>
      <Sidebar />   
      <main className='flex-1 p-4 lg:ml-64 ml-16'>
        
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-6 bg-muted dark:bg-accent border-b border-muted-50 rounded-lg mb-6 shadow-md">
            <h5 className="text-xl font-bold text-secondary m-0">
            Gestion des Soumissions
          </h5>
        </header>

        {/* Section de démonstration des notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-md">
          <h6 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
            Démonstration des Notifications
          </h6>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={handleAdd}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Add className="h-5 w-5" />
              Succès
            </button>
            
            <button
              onClick={handleError}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Delete className="h-5 w-5" />
              Erreur
            </button>
            
            <button
              onClick={handleEdit}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Edit className="h-5 w-5" />
              Info
            </button>
            
            <button
              onClick={handleDelete}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              <Description className="h-5 w-5" />
              Warning
            </button>
          </div>
        </div>
      </main> 
    </div>
  )
}

export default Soumissions
