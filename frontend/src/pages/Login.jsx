import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Person, Lock, Login as LoginIcon } from '@mui/icons-material';
import Background from '../assets/Background.png';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Simulation de connexion - à remplacer par la logique d'API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Stockage du token (à remplacer par la logique)
      localStorage.setItem('token', 'demo-token');
      
      // Redirection vers le home
      navigate('/home');
    } catch (error) {
      console.error('Erreur de connexion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Image de fond en arrière-plan */}
      <div className="absolute inset-0 z-0">
        <img 
          src={Background} 
          alt="Background" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Formulaire superposé à droite */}
      <div className="flex-1 flex items-center justify-end p-6 md:p-60 relative z-10">
        <div className="w-full max-w-md ">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-orange-500 mb-2">Welcome</h1>
              <p className="text-gray-600">Identifiez-vous pour accéder aux données l'entreprise</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-12">
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Person className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    placeholder="Nom d'utilisateur"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    placeholder="Mot de passe"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Connexion...</span>
                  </>
                ) : (
                  <>
                    <LoginIcon className="h-5 w-5" />
                    <span>Se connecter</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;