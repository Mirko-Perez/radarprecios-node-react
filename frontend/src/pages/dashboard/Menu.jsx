import {
  FiArrowRight,
  FiCheckCircle,
  FiLogOut,
  FiSettings,
  FiUser,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Menu = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = [1, 2].includes(user?.permissionId);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
      navigate("/", { replace: true });
    } catch (error) {
      // Error handling sin console.log
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-6">
            <div className="bg-white rounded-full p-4 shadow-lg">
              <img
                src="/logo-fritz.png"
                alt="Fritz Logo"
                className="h-16 w-auto"
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Menú Principal
          </h1>
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <FiUser className="w-5 h-5" />
            <span className="text-lg">
              Bienvenido,{" "}
              <span className="font-bold">{user?.username || "Usuario"}!</span>
            </span>
          </div>
        </div>

        {/* Menu Cards */}
        <div className="space-y-4">
          {/* Check-in */}
          <button
            type="button"
            onClick={() => navigate("/check-in")}
            className="w-full bg-white hover:bg-blue-50 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl p-6 group transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 group-hover:bg-blue-200 rounded-full p-3 transition-colors duration-300">
                  <FiCheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Hacer Check-In
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Registra tu entrada o salida
                  </p>
                </div>
              </div>
              <FiArrowRight className="w-6 h-6 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </button>

          {/* Admin Panel */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="w-full bg-white hover:bg-purple-50 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl p-6 group transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 group-hover:bg-purple-200 rounded-full p-3 transition-colors duration-300">
                    <FiSettings className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-semibold text-gray-800">
                      Panel de Administración
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Gestiona usuarios y configuraciones
                    </p>
                  </div>
                </div>
                <FiArrowRight className="w-6 h-6 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </button>
          )}

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full bg-white hover:bg-red-50 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl p-6 group transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-red-100 group-hover:bg-red-200 rounded-full p-3 transition-colors duration-300">
                  <FiLogOut className="w-6 h-6 text-red-600" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Cerrar Sesión
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Salir de tu cuenta de forma segura
                  </p>
                </div>
              </div>
              <FiArrowRight className="w-6 h-6 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 sm:mt-12">
          <p className="text-gray-500 text-xs sm:text-sm">
            © 2025 RadarPrecios - Sistema de monitoreo de precios
          </p>
        </div>
      </div>
    </div>
  );
};

export default Menu;
