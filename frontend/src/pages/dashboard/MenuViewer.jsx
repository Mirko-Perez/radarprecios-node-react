import { useNavigate } from "react-router-dom";
import { FiLogOut, FiMapPin } from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";

const MenuViewer = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const regiones = [
    "Andes",
    "Capital",
    "Centro",
    "Centrooccidente",
    "Occidente",
    "Oriente",
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleRegionClick = (region) => {
    // Convertir el nombre de la región a minúsculas para la URL
    const regionLower = region.toLowerCase();
    // Navegar a la ruta correspondiente de ver-todo
    navigate(`/${regionLower}/ver-todo`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-6">
            <div className="bg-white rounded-full p-4 shadow-lg">
              <FiMapPin className="h-16 w-16 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Seleccione una Región
          </h1>
          <p className="text-gray-600 text-lg">
            Elige la región que deseas consultar
          </p>
        </div>

        {/* Region Cards */}
        <div className="space-y-4 mb-8">
          {regiones.map((region) => (
            <button
              type="button"
              key={region}
              onClick={() => handleRegionClick(region)}
              className="w-full bg-white hover:bg-blue-50 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl p-6 group transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 group-hover:bg-blue-200 rounded-full p-3 transition-colors duration-300">
                    <FiMapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-semibold text-gray-800">
                      {region}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Ver productos y precios de {region}
                    </p>
                  </div>
                </div>
                <div className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Logout Button */}
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
            <div className="text-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </button>

        {/* Footer */}
        <div className="text-center mt-8 sm:mt-12">
          <p className="text-gray-500 text-xs sm:text-sm">
            2025 RadarPrecios - Sistema de monitoreo de precios
          </p>
        </div>
      </div>
    </div>
  );
};

export default MenuViewer;
