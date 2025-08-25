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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tableau de bord des prix</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">Prix moyens</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">1,250.00 DH</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">Nombre de postes</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-300">42</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-sm text-purple-800 dark:text-purple-200">Fournisseurs actifs</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-300">18</p>
            </div>
          </div>
        </div>
        
        {/* Section des actions */}
        <div className="bg-muted rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions disponibles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                <Add className="h-8 w-8 text-secondary mb-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ajouter un prix</span>
              </button>
              <button className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                <Edit className="h-8 w-8 text-info mb-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Modifier un prix</span>
              </button>
              <button className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                <Delete className="h-8 w-8 text-danger mb-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Supprimer un prix</span>
              </button>
              <button className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                <CloudDownload className="h-8 w-8 text-success mb-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Exporter les prix</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Section des derniers prix */}
        <div className="bg-muted rounded-lg border border-border-light dark:border-border-dark overflow-hidden mt-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Derniers prix enregistrés</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-light dark:border-border-dark">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Poste</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Prix (DH)</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Fournisseur</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Ingénieur Principal</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">15,000.00</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">TechSolutions SARL</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">15/03/2024</td>
                  </tr>
                  <tr className="border-b border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Technicien Supérieur</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">8,500.00</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Innovatech SA</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">10/03/2024</td>
                  </tr>
                  <tr className="border-b border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Assistant Administratif</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">4,200.00</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">AdminPro SARL</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">05/03/2024</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main> 
    </div>
  )
}

export default Prices
