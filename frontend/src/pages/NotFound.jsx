import React from 'react';
import { useNavigate } from 'react-router-dom';
import useNotifications from '../hooks/useNotifications';
import notFound from '../assets/undraw_page-eaten_b2rt.svg';

export default function NotFound() {
    const navigate = useNavigate();
    const { showWarning, showInfo } = useNotifications();

    // Notification d'erreur 404
    React.useEffect(() => {
      showWarning("Page non trouvée - Erreur 404");
    }, []);

    const handleGoHome = () => {
      showInfo("Redirection vers la page d'accueil");
      navigate('/home');
    };

    return (
      <div className='min-h-screen flex flex-col items-center justify-center space-y-10 bg-gray-50'>
        <h1 className='text-9xl font-bold text-[#f59e0b]'>404</h1>
        <p className='text-lg text-[#536976]'>Oups ! La page demandée n'existe pas.</p>
        <img src={notFound} alt="404" width="500px" height="500px" />
        <button
          onClick={handleGoHome}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }
  