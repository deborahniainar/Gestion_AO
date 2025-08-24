import React from 'react'
import Sidebar from '../components/Sidebar'
import useNotifications from '../hooks/useNotifications'
import {
  CloudDownload,
  Help,
  Add,
  Description,
  Edit, 
  Delete
} from "@mui/icons-material";

const Prices = () => {
  const { showSuccess, showError, showInfo, showWarning } = useNotifications();

  const handleHelp = () => {
    showInfo("Aide sur la gestion des prix");
  };

  return (
    <div className='flex min-h-screen bg-main dark:bg-primary overflow-y-auto transition-all duration-200 ease-in-out'>
      <Sidebar />   
      <main className='flex-1 p-4 lg:ml-64 ml-16'>
        
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-6 bg-muted dark:bg-accent border-b border-muted-50 rounded-lg mb-6 shadow-md">
            <h5 className="text-xl font-bold text-secondary m-0">
            Gestion des Prix
          </h5>
        </header>

        {/* Section de démonstration des notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-md">
          <h6 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
            Démonstration des Notifications - Prix
          </h6>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => showSuccess("Prix mis à jour avec succès")}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Add className="h-5 w-5" />
              Succès
            </button>
            
            <button
              onClick={() => showError("Erreur lors de la mise à jour du prix")}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Delete className="h-5 w-5" />
              Erreur
            </button>
            
            <button
              onClick={() => showInfo("Prix de référence chargé")}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Edit className="h-5 w-5" />
              Info
            </button>
            
            <button
              onClick={() => showWarning("Prix en cours de validation")}
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

export default Prices
