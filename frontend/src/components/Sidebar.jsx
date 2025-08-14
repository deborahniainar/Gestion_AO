import { Folder, Clipboard, Basket, Briefcase, People, Grid3x3, Moon } from "react-bootstrap-icons";
import { NavLink, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import logo from '../assets/Logo.png';

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside
       className="d-flex flex-column"
       style={{
         width: "260px",
         minHeight: "10vh",
         backgroundColor: "#E6E6E6",
         borderRight: "6px solid #e1e5ea",
         boxShadow: "6px 0 8px rgba(24, 22, 22, 0.08)",
         padding: "20px 16px",
         margin: "6px"
       }}
     >
      {/* Logo Section - Garde l'existant */}
      <div className="text-center mb-5">
        <img src={logo} alt="Logo" style={{ maxWidth: "120px" }} />
      </div>

      {/* Navigation Menu */}
      <nav className="nav flex-column gap-2">
        <NavLink
          to="/gestion_dao"
          className="nav-link position-relative d-flex align-items-center gap-3 py-2"
          style={{ color: "#536976" }}
        >
          {location.pathname === "/gestion_dao" && (
            <div 
              className="position-absolute"
              style={{
                left: "-6px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "3px",
                height: "20px",
                backgroundColor: "#ff7f32",
                borderRadius: "0 2px 2px 0"
              }}
            />
          )}
          <Folder size={20} />
          <span className={location.pathname === "/gestion_dao" ? "fw-semibold" : ""}>DAO</span>
        </NavLink>

        <NavLink to="/soumission" className="nav-link position-relative d-flex align-items-center gap-3 py-2" style={{ color: "#536976" }}>
          {location.pathname === "/soumission" && (
            <div 
              className="position-absolute"
              style={{
                left: "-6px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "3px",
                height: "20px",
                backgroundColor: "#ff7f32",
                borderRadius: "0 2px 2px 0"
              }}
            />
          )}
          <Clipboard size={20} />
          <span className={location.pathname === "/soumission" ? "fw-semibold" : ""}>Soumissions</span>
        </NavLink>

        <NavLink to="/marche" className="nav-link position-relative d-flex align-items-center gap-3 py-2" style={{ color: "#536976" }}>
          {location.pathname === "/marche" && (
            <div 
              className="position-absolute"
              style={{
                left: "-6px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "3px",
                height: "20px",
                backgroundColor: "#ff7f32",
                borderRadius: "0 2px 2px 0"
              }}
            />
          )}
          <Basket size={20} />
          <span className={location.pathname === "/marche" ? "fw-semibold" : ""}>Marchés</span>
        </NavLink>

        <NavLink to="/materiel" className="nav-link position-relative d-flex align-items-center gap-2 py-2" style={{ color: "#536976" }}>
          {location.pathname === "/materiel" && (
            <div 
              className="position-absolute"
              style={{
                left: "-6px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "3px",
                height: "20px",
                backgroundColor: "#ff7f32",
                borderRadius: "0 2px 2px 0"
              }}
            />
          )}
          <Briefcase size={20} />
          <span className={location.pathname === "/materiel" ? "fw-semibold" : ""}>Matériels</span>
        </NavLink>

        <NavLink to="/personnel" className="nav-link position-relative d-flex align-items-center gap-3 py-2" style={{ color: "#536976" }}>
          {location.pathname === "/personnel" && (
            <div 
              className="position-absolute"
              style={{
                left: "-6px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "3px",
                height: "20px",
                backgroundColor: "#ff7f32",
                borderRadius: "0 2px 2px 0"
              }}
            />
          )}
          <People size={20} />
          <span className={location.pathname === "/personnel" ? "fw-semibold" : ""}>Personnels</span>
        </NavLink>

        <NavLink to="/dashboard" className="nav-link position-relative d-flex align-items-center gap-3 py-2" style={{ color: "#536976" }}>
          {location.pathname === "/dashboard" && (
            <div 
              className="position-absolute"
              style={{
                left: "-6px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "3px",
                height: "20px",
                backgroundColor: "#ff7f32",
                borderRadius: "0 2px 2px 0"
              }}
            />
          )}
          <Grid3x3 size={20} />
          <span className={location.pathname === "/dashboard" ? "fw-semibold" : ""}>Dashboard</span>
        </NavLink>
      </nav>

      {/* Bottom Utility Options */}
      <div className="mt-auto pt-4" style={{ borderTop: "1px solid #e2e8f0" }}>
        <button className="btn w-100 d-flex align-items-center gap-3 justify-content-start py-2" style={{ color: "#536976" }}>
          <Moon size={18} />
          <span>Mode Nuit</span>
        </button>
        <button className="btn w-100 d-flex align-items-center gap-3 justify-content-start py-2" style={{ color: "#536976" }}>
          <i className="bi bi-box-arrow-right" style={{ fontSize: "18px" }}></i>
          <span>Deconnecter</span>
        </button>
      </div>
    </aside>
  );
}