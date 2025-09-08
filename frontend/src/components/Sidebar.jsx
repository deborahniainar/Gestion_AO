import { useEffect, useState } from "react";
import { 
  FolderOpenOutlined, 
  DescriptionOutlined, 
  LocalShippingOutlined,
  PeopleAltOutlined, 
  AttachMoneyOutlined,
  Groups2Outlined,
  BuildOutlined,
  FrontLoader,
  ReceiptLongOutlined,
  ReceiptOutlined,
  InventoryOutlined,
  BarChartOutlined, 
  DarkModeOutlined, 
  LightModeOutlined,
  LogoutOutlined,
  ExpandLess,
  ExpandMore
} from "@mui/icons-material";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import logo from '../assets/Logo.png';
import shortLogo from '../assets/Logo-short.png';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import ConfirmModal from './ConfirmModal';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [openLogoutConfirm, setOpenLogoutConfirm] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [openPrices, setOpenPrices] = useState(false);
  const { isDarkMode, toggleDarkMode } = useTheme();

  useEffect(() => {
    const onResize = () => setCollapsed(window.innerWidth < 992);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  
  useEffect(() => {
  if (location.pathname.startsWith("/price")) {
    setOpenPrices(true);
  }
}, [location.pathname]);

  const ActiveMark = ({active}) => active ? (
    <div
      className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-5 bg-secondary rounded-r-sm"
    />
  ) : null;

  const handleConfirmLogout = () => {
    try {
      logout();
    } catch {
      // ignore
    }
    setOpenLogoutConfirm(false);
    navigate('/login');
  }

  return (
    <aside
      className={`flex flex-col m-2 shadow-2xl fixed bg-main dark:bg-primary left-0 top-0 z-50 h-screen overflow-y-auto transition-all duration-200 ease-in-out ${
        collapsed ? 'w-16 p-4' : 'w-64 p-5'
      }`}
    >
      {/* Logo */}
      <div className="text-center mb-6">
        <img 
          src={collapsed ? shortLogo : logo} 
          alt="Logo" 
          className={`transition-all duration-200 ${
            collapsed ? 'max-w-8' : 'max-w-32'
          }`}
        />
      </div>

      {/* Menu */}
      <nav className="flex flex-col gap-2">
        <NavLink 
          to="/gestion_dao" 
          className={`relative flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-200 ${
            location.pathname === "/gestion_dao" 
              ? "text-secondary font-semibold" 
              : "text-primary dark:text-main hover:bg-muted dark:hover:bg-accent"
          }`}
          title="DAO"
        >
          <ActiveMark active={location.pathname === "/gestion_dao"} />
          <FolderOpenOutlined className="h-5 w-5" />
          {!collapsed && <span>DAO</span>}
        </NavLink>

        <NavLink 
          to="/personnels" 
          className={`relative flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-200 ${
            location.pathname === "/personnels" 
              ? "text-secondary font-semibold" 
              : "text-primary dark:text-main hover:bg-muted dark:hover:bg-accent"
          }`}
          title="Personnels"
        >
          <ActiveMark active={location.pathname === "/personnels"} />
          <PeopleAltOutlined className="h-5 w-5" />
          {!collapsed && <span>Personnels</span>}
        </NavLink>

        <NavLink 
          to="/materiels" 
          className={`relative flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-200 ${
            location.pathname === "/materiels" 
              ? "text-secondary font-semibold" 
              : "text-primary dark:text-main hover:bg-muted dark:hover:bg-accent"
          }`}
          title="Materiels"
        >
          <ActiveMark active={location.pathname === "/materiels"} />
          <LocalShippingOutlined className="h-5 w-5" />
          {!collapsed && <span>Matériels</span>}
        </NavLink>
        
        {/* --- Prices avec sous-menu --- */}
        <button
          onClick={() => setOpenPrices(!openPrices)}
          className={`relative flex items-center justify-between py-2 px-3 rounded-lg transition-all duration-500 ${
            location.pathname.startsWith("/price") 
              ? "text-secondary font-semibold" 
              : "text-primary dark:text-main hover:bg-muted dark:hover:bg-accent"
          }`}
        >
          <div className="flex items-center gap-3">
            <AttachMoneyOutlined className="h-5 w-5" />
            {!collapsed && <span>Prix</span>}
          </div>
          {!collapsed && (openPrices ? <ExpandLess /> : <ExpandMore />)}
        </button>

        {openPrices && !collapsed && (
          <ul className="ml-8 mt-1 flex flex-col gap-1 text-sm">
            <NavLink 
              to="/priceMO" 
                className={`relative flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-200 ${
                location.pathname === "/priceMO" 
                  ? "text-secondary font-semibold" 
                  : "text-primary dark:text-main hover:bg-muted dark:hover:bg-accent"
              }`}
              title="Main_d_oeuvre"
            >
              <ActiveMark active={location.pathname === "/priceMO"} />
              <Groups2Outlined className="" />
              {!collapsed && <span>Main d'œuvre</span>}
            </NavLink>
            <NavLink 
              to="/priceMTX" 
                className={`relative flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-200 ${
                location.pathname === "/priceMTX" 
                  ? "text-secondary font-semibold" 
                  : "text-primary dark:text-main hover:bg-muted dark:hover:bg-accent"
              }`}
              title="Materiaux"
            >
              <ActiveMark active={location.pathname === "/priceMTX"} />
              <BuildOutlined />
              {!collapsed && <span>Matériaux</span>}
            </NavLink>
            <NavLink 
              to="/priceEQU" 
                className={`relative flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-200 ${
                location.pathname === "/priceEQU" 
                  ? "text-secondary font-semibold" 
                  : "text-primary dark:text-main hover:bg-muted dark:hover:bg-accent"
              }`}
              title="Equipements"
            >
              <ActiveMark active={location.pathname === "/priceEQU"} />
              <FrontLoader />
              {!collapsed && <span>Equipements</span>}
            </NavLink>
            <NavLink 
              to="/priceSDP" 
                className={`relative flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-200 ${
                location.pathname === "/priceSDP" 
                  ? "text-secondary font-semibold" 
                  : "text-primary dark:text-main hover:bg-muted dark:hover:bg-accent"
              }`}
              title="Sous_detail_de_prix"
            >
              <ActiveMark active={location.pathname === "/priceSDP"} />
              <ReceiptLongOutlined />
              {!collapsed && <span>Sous-détail de prix</span>}
            </NavLink>
            <NavLink 
              to="/priceBDE" 
                className={`relative flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-200 ${
                location.pathname === "/priceBDE" 
                  ? "text-secondary font-semibold" 
                  : "text-primary dark:text-main hover:bg-muted dark:hover:bg-accent"
              }`}
              title="Bordereau_de_prix"
            >
              <ActiveMark active={location.pathname === "/priceBDE"} />
              <ReceiptOutlined />
              {!collapsed && <span>Bordereau de Prix</span>}
            </NavLink>
          </ul>
        )}
        {/* --- fin sous-menu Prices --- */}

        <NavLink 
          to="/doc_admin" 
          className={`relative flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-200 ${
            location.pathname === "/doc_admin" 
              ? "text-secondary font-semibold" 
              : "text-primary dark:text-main hover:bg-muted dark:hover:bg-accent"
          }`}
          title="Documents"
        >
          <ActiveMark active={location.pathname === "/doc_admin"} />
          <DescriptionOutlined className="h-5 w-5" />
          {!collapsed && <span>Documents</span>}
        </NavLink>

        <NavLink 
          to="/soumissions" 
          className={`relative flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-200 ${
            location.pathname === "/soumissions" 
              ? "text-secondary font-semibold" 
              : "text-primary dark:text-main hover:bg-muted dark:hover:bg-accent"
          }`}
          title="Soumissions"
        >
          <ActiveMark active={location.pathname === "/soumissions"} />
          <InventoryOutlined className="h-5 w-5" />
          {!collapsed && <span>Soumissions</span>}
        </NavLink>

        <NavLink 
          to="/dashboard" 
          className={`relative flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-200 ${
            location.pathname === "/dashboard" 
              ? "text-secondary font-semibold" 
              : "text-primary dark:text-main hover:bg-muted dark:hover:bg-accent"
          }`}
          title="Dashboard"
        >
          <ActiveMark active={location.pathname === "/dashboard"} />
          <BarChartOutlined className="h-5 w-5" />
          {!collapsed && <span>Dashboard</span>}
        </NavLink>
      </nav>

      {/* Bas */}
      <div className="mt-auto pt-4 border-t border-gray-300">
        <button 
        onClick={toggleDarkMode}
          className={`w-full flex items-center gap-3 py-2 px-3 rounded-lg text-primary dark:text-main hover:bg-muted dark:hover:bg-accent transition-all duration-200 ${
            collapsed ? 'justify-center' : 'justify-start'
          }`}
          title={isDarkMode ? "Mode Jour" : "Mode Nuit"}
        >
          {isDarkMode ? <LightModeOutlined className="h-5 w-5" /> : <DarkModeOutlined className="h-5 w-5" />}
          {!collapsed && <span>{isDarkMode ? "Mode Jour" : "Mode Nuit"}</span>}
        </button>
        <button 
          onClick={() => setOpenLogoutConfirm(true)}
          className={`w-full flex items-center gap-3 py-2 px-3 rounded-lg text-gray-700 hover:bg-muted transition-all duration-200 ${
             collapsed ? 'justify-center' : 'justify-start'
           }`}
           title="Déconnecter"
         >
           <LogoutOutlined className="h-5 w-5" />
           {!collapsed && <span>Deconnecter</span>}
         </button>
        <ConfirmModal
          open={openLogoutConfirm}
          title="Déconnexion"
          message={"Voulez-vous vous déconnecter ?"}
          confirmLabel="Se déconnecter"
          cancelLabel="Annuler"
          destructive={true}
          onConfirm={handleConfirmLogout}
          onCancel={() => setOpenLogoutConfirm(false)}
        />
       </div>
     </aside>
   );
 }