import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home'
import Login from './pages/login/Login';
import DAO from './pages/gestion_dao/DAO';
import Soumission from './pages/soumission/Soumission'
import Marche from './pages/marche/Marche';
import Personnel from './pages/personnel/Personnel';
import Materiel from './pages/materiel/Materiel';
import Dashboard from './pages/dashboard/Dashboard';

import './App.css';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/gestion_dao" element={<DAO />} />
          <Route path="/soumission" element={<Soumission />} />
          <Route path="/marche" element={<Marche />} />        
          <Route path="/personnel" element={<Personnel />} />
          <Route path="/materiel" element={<Materiel />} />       
          <Route path="/dashboard" element={<Dashboard />} />       


          <Route path="/" element={<Navigate to="/login" replace />} />
          {/* Ajoutez d'autres routes ici plus tard */}


          {/* Route 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
