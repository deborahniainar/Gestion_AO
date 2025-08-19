import React from 'react'
import Sidebar from '../components/Sidebar'
import useNotifications from '../hooks/useNotifications'

const Home = () => {
  const { showSuccess, showInfo } = useNotifications();

  // Notification de bienvenue
  React.useEffect(() => {
    showInfo("Bienvenue dans votre espace de gestion d'appels d'offres !");
  }, []);

  return (
    <div className='flex min-h-screen bg-main dark:bg-primary overflow-y-auto transition-all duration-200 ease-in-out'>
      <Sidebar />
      <main className='flex-1 p-4 lg:ml-64 ml-16'>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Accueil
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Bienvenue dans votre système de gestion d'appels d'offres.
          </p>
          <button
            onClick={() => showSuccess("Page d'accueil chargée avec succès")}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Tester les notifications
          </button>
        </div>
      </main>
    </div>
  )
}

export default Home