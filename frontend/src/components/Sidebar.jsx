import { useEffect, useState } from "react";
import { Folder, Clipboard, Basket, Briefcase, People, Grid3x3, Moon } from "react-bootstrap-icons";
import { NavLink, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import logo from '../assets/Logo.png';
import shortLogo from '../assets/Logo-short.png';

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const onResize = () => setCollapsed(window.innerWidth < 992);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const itemCls = "nav-link position-relative d-flex align-items-center gap-3 py-2";
  const justify = collapsed ? "center" : "flex-start";

  const ActiveMark = ({active}) => active ? (
    <div
      className="position-absolute"
      style={{ left: "-6px", top: "50%", transform: "translateY(-50%)", width: 3, height: 20, backgroundColor: "#ff7f32", borderRadius: "0 2px 2px 0" }}
    />
  ) : null;

  return (
    <aside
      className="d-flex flex-column"
      style={{
        width: collapsed ? 64 : 260,
        height: "100vh", // Hauteur fixe à 100% de la hauteur de l'écran
        backgroundColor: "#E6E6E6",
        borderRight: "1px solid #e1e5ea",
        boxShadow: "2px 0 8px rgba(0,0,0,0.08)",
        padding: collapsed ? "16px 10px" : "20px 16px",
        margin: "6px",
        transition: "width .2s ease",
        position: "fixed", // Fixe le sidebar
        left: 0, // Position à gauche
        top: 0, // Position en haut
        zIndex: 1000, // Assure que le sidebar est au-dessus
        overflowY: "auto" // Permet le scroll si le contenu est trop long
      }}
    >
      {/* Logo */}
      <div className="text-center mb-4">
        <img src={collapsed ? shortLogo : logo} alt="Logo" style={{ maxWidth: collapsed ? 32 : 120 }} />
      </div>

      {/* Menu */}
      <nav className="nav flex-column gap-2">
        <NavLink to="/gestion_dao" className={itemCls} style={{ color: "#536976", justifyContent: justify }} title="DAO">
          <ActiveMark active={location.pathname === "/gestion_dao"} />
          <Folder size={20} />
          {!collapsed && <span className={location.pathname === "/gestion_dao" ? "fw-semibold" : ""}>DAO</span>}
        </NavLink>

        <NavLink to="/soumission" className={itemCls} style={{ color: "#536976", justifyContent: justify }} title="Soumissions">
          <ActiveMark active={location.pathname === "/soumission"} />
          <Clipboard size={20} />
          {!collapsed && <span className={location.pathname === "/soumission" ? "fw-semibold" : ""}>Soumissions</span>}
        </NavLink>

        <NavLink to="/marche" className={itemCls} style={{ color: "#536976", justifyContent: justify }} title="Marchés">
          <ActiveMark active={location.pathname === "/marche"} />
          <Basket size={20} />
          {!collapsed && <span className={location.pathname === "/marche" ? "fw-semibold" : ""}>Marchés</span>}
        </NavLink>

        <NavLink to="/materiel" className={itemCls} style={{ color: "#536976", justifyContent: justify }} title="Matériels">
          <ActiveMark active={location.pathname === "/materiel"} />
          <Briefcase size={20} />
          {!collapsed && <span className={location.pathname === "/materiel" ? "fw-semibold" : ""}>Matériels</span>}
        </NavLink>

        <NavLink to="/personnel" className={itemCls} style={{ color: "#536976", justifyContent: justify }} title="Personnels">
          <ActiveMark active={location.pathname === "/personnel"} />
          <People size={20} />
          {!collapsed && <span className={location.pathname === "/personnel" ? "fw-semibold" : ""}>Personnels</span>}
        </NavLink>

        <NavLink to="/dashboard" className={itemCls} style={{ color: "#536976", justifyContent: justify }} title="Dashboard">
          <ActiveMark active={location.pathname === "/dashboard"} />
          <Grid3x3 size={20} />
          {!collapsed && <span className={location.pathname === "/dashboard" ? "fw-semibold" : ""}>Dashboard</span>}
        </NavLink>
      </nav>

      {/* Bas */}
      <div className="mt-auto pt-4" style={{ borderTop: "1px solid #e2e8f0" }}>
        <button className="btn w-100 d-flex align-items-center gap-3 py-2" style={{ color: "#536976", justifyContent: justify }} title="Mode Nuit">
          <Moon size={18} />
          {!collapsed && <span>Mode Nuit</span>}
        </button>
        <button className="btn w-100 d-flex align-items-center gap-3 py-2" style={{ color: "#536976", justifyContent: justify }} title="Déconnecter">
          <i className="bi bi-box-arrow-right" style={{ fontSize: 18 }}></i>
          {!collapsed && <span>Deconnecter</span>}
        </button>
      </div>
    </aside>
  );
}