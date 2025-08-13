import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Background from '../../assets/Background.png';
import './Login.css';

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
    <div className="login-container color">
      {/* Image de fond en arrière-plan */}
      <div className="background-image">
        <img src={Background} alt="Background" />
      </div>
      
      {/* Formulaire superposé à droite */}
      <div className="login-form-overlay">
        <div className="container">
          <div className="row justify-content-end">
            <div className="col-md-6 col-lg-5 col-xl-4">
              <div className="card shadow-lg border-0 rounded-4">
                <div className="card-body p-5">
                  <div className="text-center mb-5">
                    <h1 className="display-5 fw-bold text">Welcome</h1>
                    <p className="text-muted">Identifiez-vous pour accéder aux données l'entreprise</p>
                  </div>
                  
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <i className="bi bi-person-fill text-muted"></i>
                        </span>
                        <input
                          type="text"
                          name="username"
                          className="form-control border-start-0"
                          placeholder="Nom d'utilisateur"
                          value={formData.username}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="mb-5">
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <i className="bi bi-key-fill text-muted"></i>
                        </span>
                        <input
                          type="password"
                          name="password"
                          className="form-control border-start-0"
                          placeholder="Mot de passe"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <button 
                      type="submit" 
                      className="btn btn-primary btn-lg w-100 fw-semibold mb-5"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Connexion...
                        </>
                      ) : (
                        'Se connecter'
                      )}
                    </button>
                  </form>
                  
                  <div className="text-center mt-4">
                    <small className="text-muted">
                      Identifiants par défaut : admin / admin123
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;