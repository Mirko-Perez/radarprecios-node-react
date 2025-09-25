import { useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiBarChart2,
  FiBox,
  FiEye,
  FiHome,
  FiMenu,
  FiSettings,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Dashboard from "../admin/dashboard/Dashboard";
import DashboardAvanzado from "../admin/dashboard/DashboardAvanzado";
import ObservationsList from "../admin/dashboard/ObservationsList";
import GestionProductos from "../admin/products/GestionProductos";
import MenuParametros from "../admin/products/MenuParametros";
import UserManagement from "../admin/users/UserManagement";

const MenuAdmin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const { user } = useAuth();

  const handleNavigate = (section) => {
    setActiveSection(section);
    setSidebarOpen(false);
  };

  // Allow deep-linking to a specific section, e.g., navigate('/admin', { state: { section: 'agenda' }})
  useEffect(() => {
    const sectionFromState = location.state?.section;
    if (sectionFromState) {
      setActiveSection(sectionFromState);
    }
    // cleanup state after reading to avoid sticking when navigating back
    return () => {
      if (location.state?.section) {
        navigate(location.pathname, { replace: true, state: {} });
      }
    };
  }, [location.state, location.pathname, navigate]);

  const getSectionTitle = () => {
    switch (activeSection) {
      case "dashboard":
        return "Dashboard";
      case "dashboard-avanzado":
        return "Dashboard Avanzado";
      case "gestion-usuarios":
        return "Mantenedor de Usuarios";
      case "parametros":
        return "Mantenedor de Parámetros";
      case "gestion-productos":
        return "Gestión de Productos";
      case "observaciones":
        return "Observaciones";
      default:
        return "Panel de Administración";
    }
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: FiHome },
    {
      id: "dashboard-avanzado",
      label: "Dashboard Avanzado",
      icon: FiBarChart2,
    },
    { id: "gestion-usuarios", label: "Mantenedor de Usuarios", icon: FiUsers },
    { id: "parametros", label: "Mantenedor de Parámetros", icon: FiSettings },
    { id: "gestion-productos", label: "Gestión de Productos", icon: FiBox },
    { id: "observaciones", label: "Observaciones", icon: FiEye },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <Dashboard />;
      case "dashboard-avanzado":
        return <DashboardAvanzado />;
      case "gestion-usuarios":
        return <UserManagement />;
      case "parametros":
        return <MenuParametros />;
      case "gestion-productos":
        return <GestionProductos />;
      case "observaciones":
        return <ObservationsList />;
      default:
        return (
          <div>
            <h1 className="text-3xl text-gray-800 mb-6 font-bold">
              Bienvenido al Panel de Administración
            </h1>
            <p className="text-gray-600 text-lg">
              Selecciona una opción del menú para comenzar a gestionar el
              sistema.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Botón hamburguesa mobile */}
      <button
        type="button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md hover:bg-gray-50 transition-colors"
        aria-label="Abrir menú"
      >
        {sidebarOpen ? (
          <FiX className="w-6 h-6 text-gray-600" />
        ) : (
          <FiMenu className="w-6 h-6 text-gray-600" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`
    fixed inset-y-0 left-0 z-50 w-56
    bg-white border-r border-gray-200
    flex flex-col
    transform transition-transform duration-300 ease-in-out
    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
  `}
      >
        {/* Logo arriba */}
        <div className="h-20 flex items-center px-6 border-b border-gray-200 bg-white flex-shrink-0">
          <img
            src="/logo-fritz.png"
            alt="Logo"
            className="h-7 mr-2 object-contain"
          />
          <span className="text-gray-900 font-bold text-xl leading-tight">
            Radar de Precio
          </span>
        </div>

        {/* Menú scrollable */}
        <div className="flex-1 overflow-y-auto pt-3 pb-3">
          <nav className="px-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`
              w-full flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors text-left 
              ${isActive ? "bg-purple-100 text-purple-700 border-l-4 border-purple-700 hover:bg-gray-100" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}
            `}
                >
                  <Icon
                    className={`w-5 h-5 mr-3 ${isActive ? "text-purple-700" : "text-gray-400"}`}
                  />
                  <span className="text-wrap text-center">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Botón volver fijo abajo */}
        <div className="p-3 border-t border-gray-200 bg-white flex-shrink-0">
          <button
            type="button"
            onClick={() => navigate("/menu")}
            className="w-full flex items-center px-3 py-3 text-sm font-medium text-white bg-gray-700 rounded-md hover:bg-gray-800 transition-colors"
          >
            <FiArrowLeft className="mr-3 h-5 w-5 flex-shrink-0" />
            <span>Volver atrás</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col ml-0 lg:ml-56">
        <header className="w-full bg-white border-b border-gray-200 px-4 lg:px-8 pr-10 h-20 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 lg:w-0" />
            <h1 className="text-2xl font-bold text-purple-700 uppercase tracking-wide">
              {getSectionTitle()}
            </h1>
          </div>
          <span className="text-base font-normal text-gray-700 normal-case">
            {user?.name || user?.username || user?.email || "Usuario"}
          </span>
        </header>

        <div className="flex-1 p-6 lg:p-8 w-full overflow-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default MenuAdmin;
