import { useState } from "react";
import { CloudArrowDown, QuestionCircle, CloudUpload } from "react-bootstrap-icons";
import Sidebar from "../../components/Sidebar";
import "bootstrap/dist/css/bootstrap.min.css";
import Image1 from '../../assets/Image1.png';
import Image2 from '../../assets/Image2.png';

export default function GestionDAO() {
  const [file, setFile] = useState(null);

  const handleUpload = (e) => {
    setFile(e.target.files[0]);
  };

  return (
    <div className="d-flex" style={{ minHeight: "100vh", backgroundColor: "#E6E6E6" }}>
      <Sidebar />

      <main className="flex-grow-1">
        {/* Header avec navbar */}
        <header
          className="d-flex justify-content-between align-items-center px-4 py-3"
          style={{ 
            backgroundColor: "#D9D9D9", 
            borderBottom: "1px solid #e1e5ea",
            borderRadius: "8px",
            margin: "16px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
          }}
        >
          <h5 className="mb-0 fw-bold" style={{ color: "#ff7f32" }}>
            Gestion des documents d'Appel d'Offre
          </h5>
          
          <div className="d-flex gap-3">
            <button 
              className="btn d-flex align-items-center justify-content-center"
              style={{ 
                backgroundColor: "transparent",
                border: "none",
                color: "#536976"
              }}
            >
              <CloudArrowDown size={40} />
            </button>
            <button 
              className="btn d-flex align-items-center justify-content-center"
              style={{
                backgroundColor: "transparent",
                border: "none",
                color: "#536976"
              }}
            >
              <QuestionCircle size={30} />
            </button>
          </div>
        </header>

        {/* Progress Bar et Step Indicator */}
        <div className="px-5 mb-4">
          {/* Progress Bar */}
          <div 
            className="mb-3"
            style={{
              height: "20px",
              width: "100%",
              backgroundColor: "#D9D9D9",
              borderRadius: "10px",
              overflow: "hidden"
            }}
          >
            <div 
              style={{
                height: "100%",
                width: "35%",
                backgroundColor: "#516774",
                borderRadius: "10px",
                transition: "width 0.3s ease"
              }}
            />
          </div>

          {/* Step Indicator */}
          <div className="d-flex align-items-center">
            <div 
              className="d-flex align-items-center justify-content-center me-3"
              style={{
                width: "32px",
                height: "32px",
                backgroundColor: "#536976",
                borderRadius: "50%",
                color: "#ff7f32",
                fontSize: "16px",
                fontWeight: "bold"
              }}
            >
              1
            </div>
            <span className="fw-semibold" style={{ color: "#ff7f32", fontSize: "16px" }}>
              Téléverser le DAO
            </span>
          </div>
        </div>

        {/* Sections du DAO */}
        <div className="px-3">
          {/* Section 1: Upload du DAO */}
          <div className="" style={{background:"#D9D9D9", borderRadius:"10px"}}>
            <div className="row">
              {/* Colonne gauche - Illustration */}
              <div className="col-md-6">
                <div className="text-center">
                  <img 
                    src={Image1} 
                    alt="Upload du DAO" 
                    style={{ Height: "100%", width: "100%" }}
                    className="img-fluid"
                  />
                </div>
              </div>
              
              {/* Colonne droite - Interface d'upload */}
              <div className="col-md-5 m-4">
                <h3 style={{color:"#5C7284"}}>Upload du DAO</h3>
                <div className="p-4" style={{ backgroundColor: "#5C7284", borderRadius: "12px" }}>
                  <div className="text-center">
                    <CloudUpload size={60} className="text-white mb-3" />
                    <p className="text-white-50 mb-3">Glissez / déposez votre fichier ici</p>
                    <input 
                      type="file" 
                      className="form-control mb-3" 
                      onChange={handleUpload}
                      style={{ backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.3)", color: "white" }}
                    />
                    {file && (
                      <p className="text-white-50 mt-2">Fichier sélectionné : {file.name}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Extraction du fichier */}
          <div className="mb-5">
            <div className="row back">
              {/* Colonne gauche - Illustration */}
              <div className="col-md-6">
                <div className="text-center">
                  <img 
                    src={Image2} 
                    alt="Extraction du fichier" 
                    style={{ maxHeight: "100%", width: "100%" }}
                    className="img-fluid"
                  />
                </div>
              </div>
              
              {/* Colonne droite - Interface d'extraction */}
              <div className="col-md-6">
                <div className="p-4" style={{ backgroundColor: "#E0E6EB", borderRadius: "12px", border: "1px solid #D0D7DE" }}>
                  <h6 className="text-dark mb-3">Extraction du fichier</h6>
                  <div className="text-center">
                    <div className="mb-3">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Chargement...</span>
                      </div>
                    </div>
                    <p className="text-muted">Extraction en cours...</p>
                    <div className="progress mb-3" style={{ height: "8px" }}>
                      <div 
                        className="progress-bar" 
                        style={{ backgroundColor: "#ff7f32", width: "60%" }}
                      ></div>
                    </div>
                    <small className="text-muted">60% terminé</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}