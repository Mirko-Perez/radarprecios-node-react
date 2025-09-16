import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import { FiLogOut, FiCamera, FiRefreshCw } from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

const FotoAnaquel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, logout } = useContext(AuthContext);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [analysisResults, setAnalysisResults] = useState(null);
  const [storeInfo, setStoreInfo] = useState(null);
  const [activeCheckIn, setActiveCheckIn] = useState(null);
  const [isCheckingActiveCheckIn, setIsCheckingActiveCheckIn] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

  // Check for active check-in only if no navigation state is provided
  useEffect(() => {
    const checkActiveCheckIn = async () => {
      try {
        const response = await axios.get(`${API_URL}/checkins/active`, {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: (status) => status < 500,
        });

        // Handle the backend response format correctly
        if (response.data && response.data.success && response.data.data) {
          const checkInData = response.data.data;
          // Map the backend field names to frontend expected names
          setActiveCheckIn({
            ...checkInData,
            checkin_id: checkInData.checkin_id,
            region_nombre: checkInData.region_name,
            comercio_nombre: checkInData.store_name,
            region_id: checkInData.region_id,
            store_id: checkInData.store_id,
            created_at: checkInData.created_at
          });
        } else {
          // No active check-in found
          setActiveCheckIn(null);
        }
      } catch (error) {
        console.error("Error al verificar check-in activo:", error);
        setActiveCheckIn(null);
      } finally {
        setIsCheckingActiveCheckIn(false);
      }
    };

    if (token) {
      checkActiveCheckIn();
    } else {
      setIsCheckingActiveCheckIn(false);
    }
  }, [token]);

  // Get store info from navigation state or active check-in
  useEffect(() => {
    if (location.state) {
      setStoreInfo({
        regionName: location.state.regionName,
        storeName: location.state.storeName,
        regionId: location.state.selectedRegion,
        storeId: location.state.selectedStore
      });
    } else if (activeCheckIn) {
      setStoreInfo({
        regionName: activeCheckIn.region_nombre,
        storeName: activeCheckIn.comercio_nombre,
        regionId: activeCheckIn.region_id,
        storeId: activeCheckIn.store_id
      });
    }
  }, [location.state, activeCheckIn]);

  // Show loading while checking active check-in
  if (isCheckingActiveCheckIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando check-in activo...</p>
        </div>
      </div>
    );
  }

  // Mock analysis data - based on retail "tienda perfecta" metrics
  const mockAnalysisData = {
    precio: 78,        // Price compliance - etiquetas visibles, precios correctos
    inventario: 45,    // Stock availability - productos disponibles, sin rupturas
    planograma: 62,    // Planogram compliance - ubicación correcta, organización
    categoria: "Mayonesas",
    confianza: 85
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setAnalysisResults(null);
    }
  };

  const handleAnalyzePhoto = async () => {
    if (!photo) {
      toast.error("Por favor toma una foto primero");
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate analysis delay
    setTimeout(() => {
      setAnalysisResults(mockAnalysisData);
      setIsAnalyzing(false);
      toast.success("Análisis completado");
    }, 3000);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.log(error);
    }
  };

  const getPercentageColor = (percentage) => {
    if (percentage >= 70) return "text-green-500";
    if (percentage >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  const getPercentageBarColor = (percentage) => {
    if (percentage >= 70) return "bg-green-500";
    if (percentage >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-white">Foto Anaquel</h2>
              
              <button
                type="button"
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-500 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 hover:scale-105"
              >
                <FiLogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {/* Store Info */}
            {storeInfo && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                <div className="flex items-center mb-4">
                  <div className="w-3 h-3 bg-purple-400 rounded-full mr-3 animate-pulse"></div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Información del Comercio
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 font-medium">Región</p>
                    <p className="text-gray-900">{storeInfo.regionName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Tienda</p>
                    <p className="text-gray-900">{storeInfo.storeName}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Camera Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">Capturar Anaquel</h3>
              
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                {photoPreview ? (
                  <div className="space-y-4">
                    <img
                      src={photoPreview}
                      alt="Vista previa del anaquel"
                      className="max-w-full h-64 object-cover rounded-lg mx-auto"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhoto(null);
                        setPhotoPreview("");
                        setAnalysisResults(null);
                      }}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Eliminar Foto
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <FiCamera className="w-16 h-16 text-gray-400 mx-auto" />
                    <p className="text-gray-600">Toma una foto del anaquel para analizar</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <label
                  htmlFor="photo-upload"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg cursor-pointer text-center"
                >
                  <span className="flex items-center justify-center">
                    <FiCamera className="w-5 h-5 mr-2" />
                    {photo ? "Cambiar Foto" : "Tomar Foto"}
                  </span>
                </label>

                {photo && (
                  <button
                    type="button"
                    onClick={handleAnalyzePhoto}
                    disabled={isAnalyzing}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl disabled:opacity-50 transition-all transform hover:scale-105 shadow-lg"
                  >
                    <span className="flex items-center justify-center">
                      {isAnalyzing ? (
                        <FiRefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      )}
                      {isAnalyzing ? "Analizando..." : "Analizar"}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Analysis Results */}
            {analysisResults && (
              <div className="bg-gray-900 rounded-2xl p-8 text-white space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">Resultados del Análisis</h3>
                  <p className="text-gray-300">Categoría: {analysisResults.categoria}</p>
                </div>

                <div className="space-y-6">
                  {/* Precio */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium">Precio</span>
                      <span className={`text-3xl font-bold ${getPercentageColor(analysisResults.precio)}`}>
                        {analysisResults.precio}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${getPercentageBarColor(analysisResults.precio)} transition-all duration-1000`}
                        style={{ width: `${analysisResults.precio}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-400">Etiquetas de precio visibles, precios correctos según acuerdos comerciales y posicionamiento estratégico</p>
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <p className="text-sm text-yellow-300 font-medium mb-2">💡 Sugerencias para mejorar:</p>
                      {analysisResults.precio >= 80 ? (
                        <p className="text-sm text-green-300">• Mantener consistencia en etiquetado y verificar precios promocionales</p>
                      ) : analysisResults.precio >= 60 ? (
                        <p className="text-sm text-yellow-300">• Revisar etiquetas poco visibles • Verificar concordancia de precios con sistema • Mejorar señalización de ofertas</p>
                      ) : (
                        <p className="text-sm text-orange-300">• Aumentar visibilidad de etiquetas • Actualizar precios desactualizados • Mejorar posicionamiento de información promocional</p>
                      )}
                    </div>
                  </div>

                  {/* Inventario */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium">Inventario</span>
                      <span className={`text-3xl font-bold ${getPercentageColor(analysisResults.inventario)}`}>
                        {analysisResults.inventario}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${getPercentageBarColor(analysisResults.inventario)} transition-all duration-1000`}
                        style={{ width: `${analysisResults.inventario}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-400">Disponibilidad de productos, ausencia de rupturas de stock y niveles adecuados de inventario</p>
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <p className="text-sm text-yellow-300 font-medium mb-2">💡 Sugerencias para mejorar:</p>
                      {analysisResults.inventario >= 80 ? (
                        <p className="text-sm text-green-300">• Continuar monitoreando rotación y coordina reposición preventiva</p>
                      ) : analysisResults.inventario >= 60 ? (
                        <p className="text-sm text-yellow-300">• Algunos productos con stock bajo. Coordina reposición urgente, revisa productos de alta rotación y optimiza frecuencia de pedidos</p>
                      ) : (
                        <p className="text-sm text-orange-300">• Rupturas críticas de stock. Reposición inmediata necesaria. Revisa cadena de suministro, aumenta frecuencia de pedidos y considera stock de seguridad</p>
                      )}
                    </div>
                  </div>

                  {/* Planograma */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium">Planograma</span>
                      <span className={`text-3xl font-bold ${getPercentageColor(analysisResults.planograma)}`}>
                        {analysisResults.planograma}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${getPercentageBarColor(analysisResults.planograma)} transition-all duration-1000`}
                        style={{ width: `${analysisResults.planograma}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-400">Cumplimiento del planograma: ubicación correcta, organización por categorías y posicionamiento vs competencia</p>
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <p className="text-sm text-yellow-300 font-medium mb-2">💡 Sugerencias para mejorar:</p>
                      {analysisResults.planograma >= 80 ? (
                        <p className="text-sm text-green-300">• Mantener la ubicación de productos y revisa nuevos lanzamientos</p>
                      ) : analysisResults.planograma >= 60 ? (
                        <p className="text-sm text-yellow-300">• Algunos productos mal ubicados. Reorganiza por categorías, mejora el facing de productos estrella y optimiza altura de productos según rotación</p>
                      ) : (
                        <p className="text-sm text-orange-300">• Planograma desorganizado. Reorganización completa necesaria: agrupa por categorías, coloca productos de alta rotación a nivel de ojos, mejora el facing y separa de competencia</p>
                      )}
                    </div>
                  </div>

                  {/* Confianza */}
                  <div className="border-t border-gray-600 pt-6">
                    <div className="text-center">
                      <p className="text-gray-300 mb-2">La confianza de este análisis es</p>
                      <p className={`text-5xl font-bold ${getPercentageColor(analysisResults.confianza)}`}>
                        {analysisResults.confianza}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Back Button */}
            <button
              type="button"
              onClick={() => navigate("/check-in")}
              className="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              <span className="flex items-center justify-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Volver al Check-In
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FotoAnaquel;
