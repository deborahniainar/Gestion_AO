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

const Dashboard = () => {
  const { showSuccess, showError, showInfo, showWarning } = useNotifications();

  const handleDownload = () => {
    showInfo("Téléchargement du rapport du tableau de bord");
  };

  const handleHelp = () => {
    showInfo("Aide sur le tableau de bord");
  };

  return (
    <div className='flex min-h-screen bg-main dark:bg-primary overflow-y-auto transition-all duration-200 ease-in-out'>
      <Sidebar />   
      <main className='flex-1 p-4 lg:ml-64 ml-16'>
        
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-6 bg-muted dark:bg-accent border-b border-muted-50 rounded-lg mb-6 shadow-md">
            <h5 className="text-xl font-bold text-secondary m-0">
            Tableau de bord et historique
          </h5>
        </header>

        {/* Section de démonstration des notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-md">
          <h6 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
            Démonstration des Notifications - Dashboard
          </h6>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => showSuccess("Données du tableau de bord mises à jour")}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Add className="h-5 w-5" />
              Succès
            </button>
            
            <button
              onClick={() => showError("Erreur lors du chargement des données")}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Delete className="h-5 w-5" />
              Erreur
            </button>
            
            <button
              onClick={() => showInfo("Nouvelles données disponibles")}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Edit className="h-5 w-5" />
              Info
            </button>
            
            <button
              onClick={() => showWarning("Données en cours de synchronisation")}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              <Description className="h-5 w-5" />
              Warning
            </button>
          </div>
        </div>
        {/* Bouton Aide flottant */}
        <button
          className="fixed bottom-6 right-10 bg-primary text-white rounded-full shadow-lg hover:bg-secondary transition-colors duration-200 animate-bounce"
          onClick={() => {
            alert("Aide / Guide utilisateur en cours de développement !");
          }}
        >
          <Help style={{ fontSize: '4rem' }} />
        </button>
      </main> 
    </div>
  )
}

export default Dashboard
