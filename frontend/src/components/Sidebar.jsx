import { useEffect, useState } from "react";
import { 
  FolderOpenOutlined, 
  DescriptionOutlined, 
  LocalShippingOutlined,
  PeopleAltOutlined, 
  AttachMoneyOutlined, 
  BarChartOutlined, 
  DarkModeOutlined, 
  LightModeOutlined,
  LogoutOutlined 
} from "@mui/icons-material";
import { NavLink, useLocation } from "react-router-dom";
import logo from '../assets/Logo.png';
import shortLogo from '../assets/Logo-short.png';
import { useTheme } from '../contexts/ThemeContext';

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { isDarkMode, toggleDarkMode } = useTheme();

  useEffect(() => {
    const onResize = () => setCollapsed(window.innerWidth < 992);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const ActiveMark = ({active}) => active ? (
    <div
      className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-5 bg-secondary rounded-r-sm"
    />
  ) : null;

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
        
        <NavLink 
          to="/prices" 
          className={`relative flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-200 ${
            location.pathname === "/prices" 
              ? "text-secondary font-semibold" 
              : "text-primary dark:text-main hover:bg-muted dark:hover:bg-accent"
          }`}
          title="Prices"
        >
          <ActiveMark active={location.pathname === "/prices"} />
          <AttachMoneyOutlined className="h-5 w-5" />
          {!collapsed && <span>Prices</span>}
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
          <ActiveMark active={location.pathname === "/soumission"} />
          <DescriptionOutlined className="h-5 w-5" />
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
          className={`w-full flex items-center gap-3 py-2 px-3 rounded-lg text-gray-700 hover:bg-muted transition-all duration-200 ${
            collapsed ? 'justify-center' : 'justify-start'
          }`}
          title="Déconnecter"
        >
          <LogoutOutlined className="h-5 w-5" />
          {!collapsed && <span>Deconnecter</span>}
        </button>
      </div>
    </aside>
  );
}