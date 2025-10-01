import axios from "axios";
import { useContext, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FiArrowRight, FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { AuthContext } from "../../contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// helpers para semana y fechas locales YYYY-MM-DD
function ymdLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function getWeekRange(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { mondayStr: ymdLocal(monday), sundayStr: ymdLocal(sunday) };
}

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
  const [assignedAgenda, setAssignedAgenda] = useState(null);
  const [assignedRegions, setAssignedRegions] = useState([]);
  const [assignedStores, setAssignedStores] = useState([]);
  const [myWeekMap, setMyWeekMap] = useState(null); // { [date]: items[] }
  const [myWeekLoading, setMyWeekLoading] = useState(false);
  const [showJustifyModal, setShowJustifyModal] = useState(false);
  const [justifyAgendaId, setJustifyAgendaId] = useState("");
  const [justifyStoreId, setJustifyStoreId] = useState("");
  const [justifyNote, setJustifyNote] = useState("");
  const [isSubmittingJustify, setIsSubmittingJustify] = useState(false);

  const isPromoter = useMemo(() => {
    if (!user) return false;
    const pid = user.permission_id ?? user.permissionId;
    const hasRole = Array.isArray(user.permissions) && user.permissions.includes('promoter');
    return pid === 4 || hasRole;
  }, [user]);

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

  // Cargar agenda semanal para promotores y extraer regiones/tiendas únicas
  useEffect(() => {
    const userId = user?.userId || user?.user_id || user?.id;
    if (!isPromoter || !userId || !token || regiones.length === 0) {
      console.log('CheckIn: Skipping agenda load', { isPromoter, userId, hasToken: !!token, regionesCount: regiones.length });
      return;
    }
    
    const fetchAssignedWeek = async () => {
      console.log('CheckIn: Fetching assigned week for promoter');
      setMyWeekLoading(true);
      try {
        const res = await axios.get(`${API_URL}/agendas/assigned/week`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('CheckIn: Assigned week response:', res.data);
        
        if (res.data.success && res.data.data && res.data.data.length > 0) {
          const weekData = res.data.data;
          console.log('CheckIn: Week data:', weekData);
          
          setMyWeekMap(
            weekData.reduce((acc, item) => {
              const d = item.date.split('T')[0];
              if (!acc[d]) acc[d] = [];
              acc[d].push(item);
              return acc;
            }, {})
          );
          
          // Extraer regiones únicas asignadas
          const uniqueRegionIds = [...new Set(weekData.map(w => w.region_id))];
          console.log('CheckIn: Unique region IDs:', uniqueRegionIds);
          const regionsData = regiones.filter(r => uniqueRegionIds.includes(r.id || r.region_id));
          console.log('CheckIn: Assigned regions:', regionsData);
          setAssignedRegions(regionsData);
          
          // Extraer tiendas únicas asignadas con deduplicación
          const storesMap = new Map();
          weekData.forEach(w => {
            if (!storesMap.has(w.store_id)) {
              storesMap.set(w.store_id, {
                store_id: w.store_id,
                store_name: w.store_name,
                region_id: w.region_id
              });
            }
          });
          const uniqueStores = Array.from(storesMap.values());
          console.log('CheckIn: Assigned stores:', uniqueStores);
          setAssignedStores(uniqueStores);
        } else {
          console.log('CheckIn: No assigned week data found');
          setMyWeekMap({});
          setAssignedRegions([]);
          setAssignedStores([]);
        }
      } catch (err) {
        console.error('CheckIn: Error cargando agenda semanal:', err);
        setMyWeekMap({});
        setAssignedRegions([]);
        setAssignedStores([]);
      } finally {
        setMyWeekLoading(false);
      }
    };
    fetchAssignedWeek();
  }, [isPromoter, user, token, regiones, API_URL]);

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
        // Si hay una agenda asignada, seleccionar la tienda asignada
        if (assignedAgenda?.store_id) {
          const found = (Array.isArray(storesData) ? storesData : []).find(s => s.store_id === assignedAgenda.store_id);
          if (found) {
            setSelectedStore({ value: found.store_id, label: found.store_name, ...found });
          }
        }
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
  }, [selectedRegion, token, assignedAgenda]);

  const handleSubmitJustification = async () => {
    // permitir justificar tanto la visita de hoy como alguna de la semana
    const agendaId = justifyAgendaId || assignedAgenda?.agenda_id;
    if (!agendaId) {
      toast.error("Selecciona la visita a justificar");
      return;
    }
    if (!justifyStoreId) {
      toast.error("Selecciona el PDV que intentaste visitar");
      return;
    }
    if (!justifyNote.trim()) {
      toast.error("Agrega una breve justificación");
      return;
    }
    try {
      setIsSubmittingJustify(true);
      await axios.put(
        `${API_URL}/agendas/${agendaId}/justify`,
        {
          justification: justifyNote.trim(),
          attempted_store_id: justifyStoreId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Justificación enviada");
      setShowJustifyModal(false);
      setAssignedAgenda(null);
      // limpiar selección para permitir flujo libre
      setSelectedRegion(null);
      setSelectedStore(null);
      setJustifyAgendaId("");
      setJustifyStoreId("");
      setJustifyNote("");
    } catch (e) {
      const msg = e?.response?.data?.message || "No se pudo enviar la justificación";
      toast.error(msg);
    } finally {
      setIsSubmittingJustify(false);
    }
  };

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

      // Si hay agenda asignada para hoy, marcarla como iniciada
      if (assignedAgenda?.agenda_id) {
        try {
          await axios.put(
            `${API_URL}/agendas/${assignedAgenda.agenda_id}`,
            { status: 'iniciado' },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (e) {
          console.warn('No se pudo marcar agenda como iniciada:', e?.response?.data || e.message);
        }
      }

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

      // Marcar agenda como completada si había asignación
      if (assignedAgenda?.agenda_id) {
        try {
          await axios.put(
            `${API_URL}/agendas/${assignedAgenda.agenda_id}`,
            { status: 'completado' },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (e) {
          console.warn('No se pudo marcar agenda como completada:', e?.response?.data || e.message);
        }
      }
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
              <div className="space-y-6">
                {isPromoter && myWeekMap && Object.keys(myWeekMap).length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-xl">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-blue-800">Tu agenda semanal</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Tienes {Object.values(myWeekMap).flat().length} visita(s) asignada(s) esta semana.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowJustifyModal(true)}
                        className="px-3 py-2 text-sm bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
                      >
                        Justificar visita
                      </button>
                    </div>
                  </div>
                )}
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
                        {!isPromoter ? (
                          <p>No tienes un check-in activo. Para hacer un nuevo check-in, selecciona una región y una tienda.</p>
                        ) : (
                          <p>Selecciona una región y tienda de tu agenda semanal para hacer check-in.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleCheckIn} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {isPromoter ? 'Región asignada (de tu semana)' : 'Selecciona una región'}
                      </label>
                      <Select
                        options={isPromoter 
                          ? assignedRegions.map(r => ({ value: r.id, label: r.nombre, ruta: r.ruta }))
                          : regiones.map(r => ({ value: r.id, label: r.nombre, ruta: r.ruta }))
                        }
                        value={selectedRegion ? { value: selectedRegion.id, label: selectedRegion.nombre } : null}
                        onChange={handleRegionChange}
                        placeholder={isPromoter ? "Selecciona una región de tu agenda..." : "Selecciona una región..."}
                        isDisabled={isSaving || (isPromoter && assignedRegions.length === 0)}
                        styles={customSelectStyles}
                      />
                      {isPromoter && assignedRegions.length === 0 && (
                        <p className="text-sm text-amber-600 mt-1">No tienes regiones asignadas esta semana</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {isPromoter ? 'Tienda asignada (de tu semana)' : 'Selecciona una tienda'}
                      </label>
                      <Select
                        options={isPromoter
                          ? assignedStores
                              .filter(s => s.region_id === selectedRegion?.id)
                              .map(s => ({ value: s.store_id, label: s.store_name }))
                          : stores
                        }
                        value={selectedStore}
                        onChange={handleStoreChange}
                        placeholder={isLoadingStores ? "Cargando tiendas..." : "Selecciona una tienda de tu agenda..."}
                        isDisabled={!selectedRegion || isLoadingStores || isSaving || (isPromoter && assignedStores.length === 0)}
                        styles={customSelectStyles}
                      />
                      {isPromoter && selectedRegion && assignedStores.filter(s => s.region_id === selectedRegion.id).length === 0 && (
                        <p className="text-sm text-amber-600 mt-1">No tienes tiendas asignadas en esta región</p>
                      )}
                    </div>

                    {/* Observación removida del formulario de Check-In; ahora se ingresa durante la sesión activa y se guarda al hacer Check-Out */}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
                      disabled={isSaving || !selectedRegion || !selectedStore}
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

                {isPromoter && myWeekMap && Object.keys(myWeekMap).length > 0 && (
                  <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 p-6 rounded-2xl shadow-md">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <h3 className="text-xl font-bold text-gray-800">Mis Visitas de la Semana</h3>
                      </div>
                      <span className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-full font-semibold">
                        {Object.values(myWeekMap).flat().length} visita(s)
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {Object.entries(myWeekMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, visits]) => {
                        const dateObj = new Date(date + 'T00:00:00');
                        const today = new Date().toISOString().split('T')[0];
                        const isToday = date === today;
                        const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
                        const dayNum = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                        
                        return (
                          <div key={date} className={`bg-white border-2 ${isToday ? 'border-green-400 shadow-lg' : 'border-gray-200'} rounded-xl overflow-hidden`}>
                            <div className={`px-4 py-3 flex items-center justify-between ${isToday ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gray-100'}`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-full ${isToday ? 'bg-white/20' : 'bg-blue-500'} flex items-center justify-center`}>
                                  <span className={`text-lg font-bold ${isToday ? 'text-white' : 'text-white'}`}>
                                    {dateObj.getDate()}
                                  </span>
                                </div>
                                <div>
                                  <div className={`font-bold capitalize ${isToday ? 'text-white' : 'text-gray-800'}`}>
                                    {dayName}
                                  </div>
                                  <div className={`text-sm ${isToday ? 'text-white/90' : 'text-gray-600'}`}>
                                    {dayNum}
                                  </div>
                                </div>
                                {isToday && (
                                  <span className="ml-2 px-2 py-1 bg-white text-green-700 text-xs font-bold rounded-full">
                                    HOY
                                  </span>
                                )}
                              </div>
                              <span className={`text-sm font-semibold ${isToday ? 'text-white' : 'text-gray-600'}`}>
                                {visits.length} {visits.length === 1 ? 'visita' : 'visitas'}
                              </span>
                            </div>
                            <div className="p-4 space-y-3">
                              {visits.map((visit, idx) => (
                                <div key={visit.agenda_id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                    {idx + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-900 mb-1">{visit.store_name}</div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                      <span>{visit.region_name}</span>
                                    </div>
                                    {visit.title && visit.title !== visit.store_name && (
                                      <div className="text-xs text-gray-500 mt-1 italic">{visit.title}</div>
                                    )}
                                  </div>
                                  <div className="flex-shrink-0">
                                    {visit.status === 'completado' && (
                                      <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Completada
                                      </span>
                                    )}
                                    {visit.status === 'iniciado' && (
                                      <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                        <svg className="w-3 h-3 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                        </svg>
                                        En curso
                                      </span>
                                    )}
                                    {visit.status === 'no_ejecutado' && (
                                      <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        Justificada
                                      </span>
                                    )}
                                    {visit.status === 'pendiente' && (
                                      <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                        </svg>
                                        Pendiente
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {showJustifyModal && (
                  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowJustifyModal(false)} />
                    <div className="relative w-full sm:w-[560px] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden z-10">
                      <div className="px-5 py-4 border-b">
                        <h3 className="text-lg font-semibold text-gray-800">Justificar visita no ejecutada</h3>
                        <p className="text-sm text-gray-600 mt-1">Selecciona el PDV que intentaste visitar y agrega una nota de lo ocurrido.</p>
                      </div>
                      <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Visita de la semana</label>
                          <Select
                            options={Object.entries(myWeekMap || {}).flatMap(([date, arr]) =>
                              (arr || []).map(it => ({ value: it.agenda_id, label: `${date} • ${it.title} • ${it.store_name}`, store_id: it.store_id }))
                            )}
                            value={justifyAgendaId ? { value: justifyAgendaId, label: (Object.entries(myWeekMap || {}).flatMap(([date, arr]) => (arr || []).map(it => ({ value: it.agenda_id, label: `${date} • ${it.title} • ${it.store_name}` })))).find(o => o.value === justifyAgendaId)?.label } : null}
                            onChange={(opt) => { setJustifyAgendaId(opt?.value || ""); setJustifyStoreId(opt?.store_id || ""); }}
                            placeholder={myWeekLoading ? "Cargando semana..." : "Selecciona la visita a justificar"}
                            isDisabled={myWeekLoading}
                            styles={customSelectStyles}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Punto de venta intentado</label>
                          <Select
                            options={stores}
                            value={stores.find(s => s.value === justifyStoreId) || null}
                            onChange={(opt) => setJustifyStoreId(opt?.value || "")}
                            placeholder={isLoadingStores ? "Cargando tiendas..." : "Selecciona una tienda"}
                            isDisabled={isLoadingStores}
                            styles={customSelectStyles}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Justificación</label>
                          <textarea
                            value={justifyNote}
                            onChange={(e) => setJustifyNote(e.target.value)}
                            rows={4}
                            placeholder="Ej.: Tienda cerrada, cambio de horario, restricción de acceso, etc."
                            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="p-4 border-t flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowJustifyModal(false)}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-xl"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmitJustification}
                          disabled={isSubmittingJustify}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-xl"
                        >
                          {isSubmittingJustify ? "Enviando..." : "Enviar Justificación"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckIn;
