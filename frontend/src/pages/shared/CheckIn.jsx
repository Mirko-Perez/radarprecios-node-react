import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiArrowRight, FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { AuthContext } from "../../contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Helper: get geolocation with retry for transient CoreLocation errors
const getLocationWithRetry = (options = {}, retries = 2, delayMs = 1000) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error("Geolocation not supported"));
    }

    const attempt = (remaining) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        (err) => {
          // 2: POSITION_UNAVAILABLE often maps to kCLErrorLocationUnknown on macOS/iOS
          if ((err.code === 2 || err.code === err.POSITION_UNAVAILABLE) && remaining > 0) {
            setTimeout(() => attempt(remaining - 1), delayMs);
          } else {
            reject(err);
          }
        },
        options
      );
    };

    attempt(retries);
  });
};

const regiones = [
  { id: 1, nombre: "Andes", ruta: "andes" },
  { id: 2, nombre: "Capital", ruta: "capital" },
  { id: 3, nombre: "Centro", ruta: "centro" },
  { id: 4, nombre: "Centrooccidente", ruta: "centrooccidente" },
  { id: 5, nombre: "Occidente", ruta: "occidente" },
  { id: 6, nombre: "Oriente", ruta: "oriente" },
];

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    borderRadius: "0.5rem",
    padding: "0.25rem",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "none",
    "&:hover": {
      borderColor: "#3b82f6",
    },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#3b82f6"
      : state.isFocused
        ? "#eff6ff"
        : "white",
    color: state.isSelected ? "white" : "#374151",
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#9ca3af",
  }),
};

const CheckIn = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useContext(AuthContext);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", isError: false });
  const [activeCheckIn, setActiveCheckIn] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(null);
  const [observation, setObservation] = useState("");

  // Check for active check-in and location permission on component mount
  useEffect(() => {
    const checkLocationPermission = async () => {
      if (!navigator.permissions) {
        setHasLocationPermission(true);
        return;
      }

      try {
        const permissionStatus = await navigator.permissions.query({
          name: "geolocation",
        });
        setHasLocationPermission(permissionStatus.state === "granted");

        permissionStatus.onchange = () => {
          setHasLocationPermission(permissionStatus.state === "granted");
        };
      } catch (error) {
        console.error("Error checking location permission:", error);
        setHasLocationPermission(true);
      }
    };

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
        setIsLoading(false);
      }
    };

    if (token) {
      checkLocationPermission();
      checkActiveCheckIn();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  // Load stores when a region is selected
  useEffect(() => {
    const fetchStores = async () => {
      if (!selectedRegion) {
        setStores([]);
        return;
      }

      setIsLoadingStores(true);
      try {
        if (!selectedRegion || !selectedRegion.id) {
          throw new Error("No se ha seleccionado una región válida");
        }

        const response = await axios.get(
          `${API_URL}/stores/region/${selectedRegion.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Cache-Control": "no-cache",
            },
          },
        );

        // Handle new consistent response format
        const storesData = response.data.success ? response.data.data : response.data;
        setStores(
          Array.isArray(storesData) ? storesData.map((store) => ({
            value: store.store_id,
            label: store.store_name,
            ...store,
          })) : []
        );
      } catch (error) {
        console.error("Error al cargar tiendas:", error);
        setMessage({
          text: "Error al cargar las tiendas",
          isError: true,
        });
      } finally {
        setIsLoadingStores(false);
      }
    };

    fetchStores();
  }, [selectedRegion, token]);

  const handleRegionChange = (selectedOption) => {
    if (!selectedOption) {
      setSelectedRegion(null);
      setSelectedStore(null);
      return;
    }

    const region = {
      id: selectedOption.value,
      nombre: selectedOption.label,
      ruta: selectedOption.ruta,
    };

    setSelectedRegion(region);
    setSelectedStore(null);
    setMessage({ text: "", isError: false });
  };

  const handleStoreChange = (selectedOption) => {
    setSelectedStore(selectedOption);
    setMessage({ text: "", isError: false });
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();

    if (!selectedRegion || !selectedStore) {
      setMessage({
        text: "Por favor selecciona una región y una tienda",
        isError: true,
      });
      return;
    }

    // We won't block the user if permission is denied; we'll try to get location and continue without it if needed
    if (navigator.permissions) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: "geolocation" });
        if (permissionStatus.state === "denied") {
          // Warn but continue
          setMessage({
            text: "No pudimos acceder a tu ubicación (permiso denegado). Continuaremos sin geolocalización.",
            isError: false,
          });
        }
      } catch {
        // ignore permission query failures
      }
    }

    setIsSaving(true);
    setMessage({ text: "", isError: false });

    try {
      // Get user's location with retry, but don't fail the flow if it errors
      let latitude = null;
      let longitude = null;

      try {
        const position = await getLocationWithRetry(
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 30000 },
          2,
          1000
        );
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (geoErr) {
        console.warn("Geolocation failed, proceeding without location:", geoErr);
        setMessage({
          text: "No se pudo determinar tu ubicación. Continuamos sin geolocalización.",
          isError: false,
        });
      }

      // Create new check-in
      const response = await axios.post(
        `${API_URL}/checkins`,
        {
          region_id: selectedRegion.id,
          store_id: selectedStore.value,
          latitude,
          longitude,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      // Extract new check-in object from backend's standard response shape
      const createdCheckIn = response.data?.data || response.data;
      const newCheckinId = createdCheckIn?.checkin_id;

      // Observaciones ahora se registran en Check-Out, no aquí

      // Prepare the check-in data with all required fields (ensure checkin_id is present)
      const checkInData = {
        ...createdCheckIn,
        checkin_id: newCheckinId,
        comercio_nombre: selectedStore.label,
        region_nombre: selectedRegion.nombre,
        region_id: selectedRegion.id,
        store_id: selectedStore.value,
        created_at: createdCheckIn?.created_at || new Date().toISOString(),
      };

      setActiveCheckIn(checkInData);
      // No limpiar aquí; se permite escribir observación durante la sesión activa y guardar en Check-Out

      setTimeout(() => {
        setMessage({
          text: "Check-in realizado correctamente",
          isError: false,
        });
        setIsSaving(false);
      }, 0);
    } catch (error) {
      console.error("Error al realizar el check-in:", error);
      const errorMessage =
        error.response?.data?.message || "Error al realizar el check-in";
      setMessage({
        text: errorMessage,
        isError: true,
      });
      toast.error(errorMessage || "Error al realizar el check-out", { autoClose: 3000 });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCheckOut = async () => {
    if (!activeCheckIn) return;

    setIsSaving(true);
    setMessage({ text: "", isError: false });

    try {
      // Guardar observación (opcional) antes de cerrar la sesión
      if (observation.trim()) {
        try {
          // fallback: si no está presente el checkin_id en el estado, consultarlo
          let checkinIdToUse = activeCheckIn?.checkin_id;
          if (!checkinIdToUse) {
            try {
              const activeRes = await axios.get(`${API_URL}/checkins/active`, {
                headers: { Authorization: `Bearer ${token}` },
                validateStatus: (status) => status < 500,
              });
              const activeData = activeRes.data?.data || activeRes.data;
              checkinIdToUse = activeData?.checkin_id;
            } catch (e) {
              // ignore, se intentará igual con undefined
            }
          }

          await axios.post(
            `${API_URL}/observations`,
            {
              observation_string: observation,
              user_id: user.id,
              checkin_id: checkinIdToUse,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            },
          );
        } catch (obsError) {
          console.error("Error saving observation:", obsError);
          // No bloquear el checkout si falla la observación
        }
      }

      await axios.put(
        `${API_URL}/checkins/${activeCheckIn.checkin_id}/checkout`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: (status) => status < 500,
        },
      );

      setActiveCheckIn(null);
      setObservation(""); // limpiar observación al cerrar sesión
      setMessage({
        text: "Check-out realizado correctamente",
        isError: false,
      });
      toast.success("Check-out realizado correctamente", { autoClose: 2500 });
    } catch (error) {
      console.error("Error al realizar el check-out:", error);
      const errorMessage =
        error.response?.data?.message || "Error al realizar el check-out";
      setMessage({
        text: errorMessage,
        isError: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
      navigate("/", { replace: true });
    } catch (error) {
      // Error handling
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-white">
                {activeCheckIn ? "Check-In Activo" : "Hacer Check-In"}
              </h2>

              {/* Botón de Cerrar Sesión */}
              <button
                type="button"
                onClick={handleLogout}
                className=" bg-red-600  hover:bg-red-500 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 hover:scale-105"
              >
                <FiLogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>

          <div className="p-8">
            {/* Message */}
            {message.text && (
              <div
                className={`p-4 rounded-xl mb-6 border-l-4 ${
                  message.isError
                    ? "bg-red-50 border-red-400 text-red-700"
                    : "bg-blue-50 border-blue-400 text-blue-700"
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-2 h-2 rounded-full mr-3 ${
                      message.isError ? "bg-red-400" : "bg-blue-400"
                    }`}
                  ></div>
                  <p className="font-medium">{message.text}</p>
                </div>
              </div>
            )}

            {activeCheckIn ? (
              /* Active Check-In Display */
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                  <div className="flex items-center mb-4">
                    <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Sesión Activa
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 font-medium">Región</p>
                      <p className="text-gray-900">
                        {activeCheckIn.region_nombre || "Desconocida"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-medium">Tienda</p>
                      <p className="text-gray-900">
                        {activeCheckIn.comercio_nombre || "Desconocida"}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-gray-600 font-medium">Iniciado el</p>
                      <p className="text-gray-900">
                        {new Date(activeCheckIn.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Campo de observación durante sesión activa (se guarda en Check-Out) */}
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observación (opcional)
                  </label>
                  <textarea
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    placeholder="Escribe tu observación aquí... (se guardará al hacer Check-Out)"
                    className="w-full min-h-[100px] p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    disabled={isSaving}
                  />
                </div>

                {/* Information message about restrictions */}
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Check-In Activo
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>
                          Tienes un check-in activo. Para hacer un nuevo check-in debes:
                        </p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Actualizar al menos un precio, o</li>
                          <li>Hacer check-out de la sesión actual</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl disabled:opacity-50 transition-all transform hover:scale-105 shadow-lg"
                    onClick={() => {
                      if (activeCheckIn?.region_id && activeCheckIn?.store_id) {
                        navigate("/region", {
                          state: {
                            selectedRegion: activeCheckIn.region_id,
                            selectedStore: activeCheckIn.store_id,
                            regionName: activeCheckIn.region_nombre,
                            storeName: activeCheckIn.comercio_nombre,
                          },
                        });
                      } else {
                        navigate("/region");
                      }
                    }}
                    disabled={
                      !activeCheckIn ||
                      !activeCheckIn.region_id ||
                      !activeCheckIn.store_id
                    }
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
                          d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4zM9 6V4h6v2H9z"
                        />
                      </svg>
                      {isSaving ? "Cargando..." : "Actualizar Precios"}
                    </span>
                  </button>
                  
                  <button
                    type="button"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-xl disabled:opacity-50 transition-all transform hover:scale-105 shadow-lg"
                    onClick={() => {
                      navigate("/foto-anaquel", {
                        state: {
                          selectedRegion: activeCheckIn.region_id,
                          selectedStore: activeCheckIn.store_id,
                          regionName: activeCheckIn.region_nombre,
                          storeName: activeCheckIn.comercio_nombre,
                        },
                      });
                    }}
                    disabled={
                      !activeCheckIn ||
                      !activeCheckIn.region_id ||
                      !activeCheckIn.store_id
                    }
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
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      "Foto Anaquel"
                    </span>
                  </button>
                  
                  <button
                    type="button"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl disabled:opacity-50 transition-all transform hover:scale-105 shadow-lg"
                    onClick={handleCheckOut}
                    disabled={isSaving}
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
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      {isSaving ? "Procesando..." : "Hacer Check-Out"}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* Check-In Form */
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        No hay check-in activo
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>
                          No tienes un check-in activo. Para hacer un nuevo check-in, selecciona una región y una tienda.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleCheckIn} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Selecciona una región
                      </label>
                      <Select
                        options={regiones.map((region) => ({
                          value: region.id,
                          label: region.nombre,
                          ruta: region.ruta,
                        }))}
                        value={
                          selectedRegion
                            ? {
                                value: selectedRegion.id,
                                label: selectedRegion.nombre,
                              }
                            : null
                        }
                        onChange={handleRegionChange}
                        placeholder="Selecciona una región..."
                        isDisabled={isSaving}
                        styles={customSelectStyles}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Selecciona una tienda
                      </label>
                      <Select
                        options={stores}
                        value={selectedStore}
                        onChange={handleStoreChange}
                        placeholder={
                          isLoadingStores
                            ? "Cargando tiendas..."
                            : "Selecciona una tienda"
                        }
                        isDisabled={
                          !selectedRegion || isLoadingStores || isSaving
                        }
                        styles={customSelectStyles}
                      />
                    </div>

                    {/* Observación removida del formulario de Check-In; ahora se ingresa durante la sesión activa y se guarda al hacer Check-Out */}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
                      disabled={
                        isSaving ||
                        !selectedRegion ||
                        !selectedStore
                      }
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
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {isSaving ? "Procesando..." : "Hacer Check-In"}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckIn;
