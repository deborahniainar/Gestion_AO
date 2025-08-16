import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css'
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Home from './pages/Home'
import DAO from './pages/DAO'
import Personnels from './pages/Personnels'
import Materiels from './pages/Materiels'

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/gestion_dao" element={<DAO />} />
            <Route path="/personnels" element={<Personnels />} />   
            <Route path="/materiels" element={<Materiels />} />       
            {/* <Route path="/price" element={<Price />} />        */}
            {/* <Route path="/soumission" element={<Soumission />} />        */}
            {/* <Route path="/dashboard" element={<Dashboard />} />        */}


            {/* Route 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
