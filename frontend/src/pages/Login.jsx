import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Person, Lock, Login as LoginIcon } from '@mui/icons-material';
import Background from '../assets/Background.png';
import useNotifications from '../hooks/useNotifications';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { showLoginSuccess, showLoginError, showLoading, updateLoading } = useNotifications();
  const { login } = useAuth(); // hook auth

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const loadingToast = showLoading('Connexion en cours...');

    try {
      const API_BASE_URL = 'http://127.0.0.1:8000'; // ton backend Python

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData)
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const errorMessage = err.detail || 'Une erreur est survenue. Veuillez réessayer.';
        setError(errorMessage);
        updateLoading(loadingToast, errorMessage, 'error');
        showLoginError(errorMessage);
        return;
      }

      const data = await response.json();
      if (!data.success) {
        setError(data.message);
        updateLoading(loadingToast, data.message, 'error');
        showLoginError(data.message);
        return;
      }

      // ✅ AuthContext : mise à jour de l'état global
      const userData = { username: formData.username, token: data.access_token };
      login(userData, data.access_token);

      updateLoading(loadingToast, 'Connexion réussie !', 'success');
      showLoginSuccess();

      setTimeout(() => {
        navigate('/gestion_dao'); // redirection après login
      }, 1000);

    } catch {
      const errorMessage = 'Impossible de se connecter. Vérifiez votre connexion réseau.';
      setError(errorMessage);
      updateLoading(loadingToast, errorMessage, 'error');
      showLoginError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={Background} alt="Background" className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 relative z-10">
        <div className="w-full max-w-sm sm:max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-orange-500 mb-1">Welcome</h1>
              <p className="text-gray-600 text-sm">Identifiez-vous pour accéder aux données de l'entreprise</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Person className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Nom d'utilisateur"
                  className={`block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 focus:bg-white ${error ? 'is-invalid' : ''}`}
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Mot de passe"
                  className={`block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 focus:bg-white ${error ? 'is-invalid' : ''}`}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

              {error && (
                <div className="border border-red-600 text-red-600 rounded-lg p-2 flex items-center gap-2 text-sm">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <span>{error}</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
