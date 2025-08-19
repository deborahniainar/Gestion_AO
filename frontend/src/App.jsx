import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css'
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Home from './pages/Home'
import DAO from './pages/DAO'
import Personnels from './pages/Personnels'
import Materiels from './pages/Materiels'
import Prices from './pages/Prices'
import Documents from './pages/Documents'
import Soumissions from './pages/Soumissions'
import Dashboard from './pages/Dashboard'

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
            <Route path="/prices" element={<Prices />} />       
            <Route path="/doc_admin" element={<Documents />} />       
            <Route path="/soumissions" element={<Soumissions />} />       
            <Route path="/dashboard" element={<Dashboard />} />       
            {/* Route 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          
          {/* ToastContainer pour les notifications */}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
