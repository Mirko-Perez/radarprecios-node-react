import { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Select from "react-select";
import { FiCalendar, FiCheck, FiClock, FiFileText, FiMapPin, FiPlus, FiTrash2, FiUser, FiRefreshCw } from "react-icons/fi";
import axios from "axios";
import { toast } from "react-toastify";
import { AuthContext } from "../../../contexts/AuthContext";

// Simple, mobile-first agenda manager (local state). Later we can connect to backend.
const AgendaManager = () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  const { token } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  // Single-visit form removed per UX simplification
  const [form, setForm] = useState(null);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const [regiones, setRegiones] = useState([]);

  const [stores, setStores] = useState([]);

  const [users, setUsers] = useState([]);

  // Estado para creación semanal (masiva)
  const [bulk, setBulk] = useState({
    assignee: null,
    region: null,
    stores: [], // multi-select of stores
    selectedDates: [], // Fechas específicas seleccionadas ['2025-01-15', ...]
    titlePrefix: "Visita",
    notes: "",
  });
  const [userWeekAgenda, setUserWeekAgenda] = useState(null); // Agenda del usuario seleccionado
  const [loadingUserAgenda, setLoadingUserAgenda] = useState(false);

  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      borderColor: "#d1d5db",
      borderRadius: "0.75rem",
      minHeight: 44,
      boxShadow: "none",
      "&:hover": { borderColor: "#a3a3a3" },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? "#7c3aed" : state.isFocused ? "#f5f3ff" : "white",
      color: state.isSelected ? "white" : "#111827",
    }),
  };

  const resetForm = () => {};

  const addItem = null; // removed

  const removeItem = async (id) => {
    try {
      await axios.delete(`${API_URL}/agendas/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      toast.error("No se pudo eliminar");
    }
  };

  const toggleDone = async (id) => {
    try {
      const item = items.find(i => i.id === id);
      const newStatus = item?.status === "pendiente" ? "programado" : "pendiente";
      await axios.put(`${API_URL}/agendas/${id}`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i)));
    } catch (e) {
      toast.error("No se pudo actualizar el estado");
    }
  };

  const filteredItems = items.filter((i) =>
    [i.title, i.notes, i.region?.label, i.store?.label, i.assignee?.label]
      .filter(Boolean)
      .some((t) => t.toLowerCase().includes(filter.toLowerCase()))
  );

  const loadAgendas = async () => {
    try {
      const res = await axios.get(`${API_URL}/agendas`, { headers: { Authorization: `Bearer ${token}` } });
      const list = res.data?.data || res.data || [];
      const getUserLabelById = (id) => {
        const u = users.find((x) => x.value === id);
        return u?.label;
      };
      const normalized = list.map(a => ({
        id: a.agenda_id,
        title: a.title,
        date: a.date,
        region: { value: a.region_id, label: a.region_name },
        store: { value: a.store_id, label: a.store_name },
        assignee: { value: a.assignee_user_id, label: getUserLabelById(a.assignee_user_id) || a.assignee_name || `Usuario ${a.assignee_user_id}` },
        notes: a.notes || "",
        status: a.status,
      }));
      setItems(normalized);
    } catch (e) {
      toast.error("No se pudieron cargar las agendas");
    }
  };

  // Cargar catálogos (regiones, usuarios) y listar agendas
  useEffect(() => {
    const loadCatalogs = async () => {
      setLoadingCatalogs(true);
      try {
        const [regRes, usersRes] = await Promise.all([
          axios.get(`${API_URL}/regions`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/admin/usuarios`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const regionesData = regRes.data?.data || regRes.data || [];
        setRegiones(regionesData.map(r => ({ value: r.region_id, label: r.region_name })));

        const usersData = usersRes.data?.data || usersRes.data || [];
        // Filtrar promotores si permissionId === 4
        const promoters = usersData
          .filter(u => (u.permission_id ?? u.permissionId) === 4 || (Array.isArray(u.permissions) && u.permissions.includes('promoter')))
          .map(u => ({ value: u.user_id, label: u.username || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email }));
        setUsers(promoters);
      } catch (e) {
        toast.error("No se pudieron cargar catálogos");
      } finally {
        setLoadingCatalogs(false);
      }
    };

    if (token) {
      loadCatalogs();
      loadAgendas();
    }
  }, [token]);

  // Prefill assignee from navigation state (AdminAgendaPreview -> AgendaManager)
  useEffect(() => {
    if (!location?.state?.prefillAssignee) return;
    const pre = location.state.prefillAssignee; // { value, label }
    // Set both single and bulk forms assignee
    setForm((f) => ({ ...f, assignee: pre }));
    setBulk((b) => ({ ...b, assignee: pre }));
  }, [location?.state?.prefillAssignee]);

  // Reetiquetar items cuando se carguen usuarios para reemplazar "Usuario X" por el nombre real
  useEffect(() => {
    if (!users.length || !items.length) return;
    setItems((prev) => prev.map((it) => {
      const found = users.find(u => u.value === it.assignee?.value);
      if (!found) return it;
      if (it.assignee?.label === `Usuario ${it.assignee?.value}` || !it.assignee?.label) {
        return { ...it, assignee: { ...it.assignee, label: found.label } };
      }
      return it;
    }));
  }, [users]);

  // Cargar agenda del usuario seleccionado para mostrar días ocupados
  useEffect(() => {
    const loadUserAgenda = async () => {
      if (!bulk.assignee?.value) {
        setUserWeekAgenda(null);
        return;
      }
      setLoadingUserAgenda(true);
      try {
        // Calcular semana actual (Lunes a Domingo)
        const today = new Date();
        const day = today.getDay();
        const diffToMonday = (day + 6) % 7;
        const monday = new Date(today);
        monday.setDate(today.getDate() - diffToMonday);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        
        const mondayStr = monday.toISOString().slice(0, 10);
        const sundayStr = sunday.toISOString().slice(0, 10);

        const res = await axios.get(`${API_URL}/agendas`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { assignee_user_id: bulk.assignee.value },
        });
        const list = res.data?.data || res.data || [];
        // Filtrar por semana actual
        const weekAgendas = list.filter(it => {
          const d = String(it.date).split('T')[0];
          return d >= mondayStr && d <= sundayStr;
        });
        setUserWeekAgenda(weekAgendas);
      } catch (e) {
        console.error('Error cargando agenda del usuario:', e);
        setUserWeekAgenda([]);
      } finally {
        setLoadingUserAgenda(false);
      }
    };
    loadUserAgenda();
  }, [bulk.assignee, token, API_URL]);

  // Cargar tiendas cuando cambia región
  useEffect(() => {
    const loadStores = async () => {
      if (!bulk.region?.value) { setStores([]); return; }
      try {
        const res = await axios.get(`${API_URL}/stores/region/${bulk.region.value}`, { headers: { Authorization: `Bearer ${token}` } });
        const storesData = res.data?.data || res.data || [];
        setStores(storesData.map(s => ({ value: s.store_id, label: s.store_name })));
      } catch (e) {
        toast.error("No se pudieron cargar tiendas");
      }
    };
    loadStores();
  }, [bulk.region?.value, token]);

  // (el anterior doble loader se consolidó arriba)

  const getDatesByWeekdays = (startStr, endStr, weekdays) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (!(start instanceof Date) || isNaN(start) || !(end instanceof Date) || isNaN(end) || start > end) return [];
    const map = { 0: weekdays.sun, 1: weekdays.mon, 2: weekdays.tue, 3: weekdays.wed, 4: weekdays.thu, 5: weekdays.fri, 6: weekdays.sat };
    const dates = [];
    const d = new Date(start);
    while (d <= end) {
      if (map[d.getDay()]) {
        const y = d.getFullYear();
        const m = `${d.getMonth() + 1}`.padStart(2, '0');
        const day = `${d.getDate()}`.padStart(2, '0');
        dates.push(`${y}-${m}-${day}`);
      }
      d.setDate(d.getDate() + 1);
    }
    return dates;
  };

  const handleBulkCreate = async (e) => {
    e.preventDefault();
    if (!bulk.assignee || !bulk.region || !bulk.stores?.length) {
      toast.error("Completa asignado, región y tiendas");
      return;
    }
    if (bulk.selectedDates.length === 0) {
      toast.error("Selecciona al menos un día en el calendario");
      return;
    }
    const items = [];
    for (const date of bulk.selectedDates) {
      for (const st of bulk.stores) {
        items.push({
          title: `${bulk.titlePrefix} ${date}`,
          date,
          region_id: bulk.region.value,
          store_id: st.value,
          notes: bulk.notes?.trim() || "",
        });
      }
    }
    try {
      setBulkLoading(true);
      const res = await axios.post(`${API_URL}/agendas/bulk`, {
        assignee_user_id: bulk.assignee.value,
        items,
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Agenda semanal creada");
      // Limpiar fechas seleccionadas y refrescar
      setBulk(b => ({ ...b, selectedDates: [] }));
      await loadAgendas();
      // Recargar agenda del usuario
      if (bulk.assignee?.value) {
        const res = await axios.get(`${API_URL}/agendas`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { assignee_user_id: bulk.assignee.value },
        });
        const list = res.data?.data || res.data || [];
        const today = new Date();
        const day = today.getDay();
        const diffToMonday = (day + 6) % 7;
        const monday = new Date(today);
        monday.setDate(today.getDate() - diffToMonday);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        const mondayStr = monday.toISOString().slice(0, 10);
        const sundayStr = sunday.toISOString().slice(0, 10);
        const weekAgendas = list.filter(it => {
          const d = String(it.date).split('T')[0];
          return d >= mondayStr && d <= sundayStr;
        });
        setUserWeekAgenda(weekAgendas);
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "No se pudo crear agenda semanal");
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleDateSelection = (dateStr) => {
    setBulk(b => {
      const isSelected = b.selectedDates.includes(dateStr);
      return {
        ...b,
        selectedDates: isSelected
          ? b.selectedDates.filter(d => d !== dateStr)
          : [...b.selectedDates, dateStr].sort()
      };
    });
  };

  const getWeekDays = () => {
    const today = new Date();
    const day = today.getDay();
    const diffToMonday = (day + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - diffToMonday);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({
        date: d,
        dateStr: d.toISOString().slice(0, 10),
        dayName: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d.getDay()],
        dayNum: d.getDate(),
      });
    }
    return days;
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header actions */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/agenda-preview')}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700"
            title="Volver a Vista Admin"
          >
            ← Volver
          </button>
          <button
            type="button"
            onClick={loadAgendas}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-2 transition-all"
            title="Actualizar lista de agendas"
          >
            <FiRefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
        <div className="flex-1">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar en agenda..."
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
        >
          Limpiar formulario
        </button>
      </div>

      {/* Formulario de visita individual fue removido para simplificar el flujo */}

      {/* Creación semanal */}
      <form onSubmit={handleBulkCreate} className="bg-white rounded-2xl shadow p-4 sm:p-6 mb-8 border border-indigo-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Crear Agenda Semanal</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Asignar a</label>
            <Select
              styles={customSelectStyles}
              options={users}
              value={bulk.assignee}
              onChange={(opt) => setBulk((b) => ({ ...b, assignee: opt }))}
              placeholder={loadingCatalogs ? "Cargando usuarios..." : "Selecciona usuario"}
              isDisabled={loadingCatalogs}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Región</label>
            <Select
              styles={customSelectStyles}
              options={regiones}
              value={bulk.region}
              onChange={(opt) => setBulk((b) => ({ ...b, region: opt, store: null }))}
              placeholder={loadingCatalogs ? "Cargando regiones..." : "Selecciona región"}
              isDisabled={loadingCatalogs}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tiendas (una o varias)</label>
            <Select
              styles={customSelectStyles}
              isMulti
              options={stores}
              value={bulk.stores}
              onChange={(opts) => setBulk((b) => ({ ...b, stores: opts || [] }))}
              placeholder={!bulk.region ? "Primero selecciona región" : stores.length === 0 ? "Sin tiendas" : "Selecciona tiendas"}
              isDisabled={!bulk.region}
            />
          </div>
          <div className="sm:col-span-2 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <FiCalendar className="w-6 h-6 text-indigo-600" />
              <h3 className="text-lg font-bold text-gray-800">Calendario Semanal</h3>
            </div>
            {!bulk.assignee ? (
              <p className="text-sm text-gray-600 text-center py-8">Selecciona un promotor para ver su calendario</p>
            ) : loadingUserAgenda ? (
              <p className="text-sm text-gray-600 text-center py-8">Cargando calendario...</p>
            ) : (
              <>
                <p className="text-xs text-gray-700 mb-4 font-medium">Haz clic en los días para programar visitas. Los días con visitas existentes aparecen marcados.</p>
                <div className="grid grid-cols-7 gap-2">
                  {getWeekDays().map((day) => {
                    const hasAgenda = userWeekAgenda?.some(a => String(a.date).split('T')[0] === day.dateStr);
                    const isSelected = bulk.selectedDates.includes(day.dateStr);
                    const isToday = day.dateStr === new Date().toISOString().slice(0, 10);
                    return (
                      <button
                        key={day.dateStr}
                        type="button"
                        onClick={() => toggleDateSelection(day.dateStr)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-105' :
                          hasAgenda ? 'bg-red-100 border-red-300 text-red-800' :
                          'bg-white border-gray-300 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50'
                        }`}
                      >
                        <div className="text-xs font-semibold">{day.dayName}</div>
                        <div className="text-2xl font-bold mt-1">{day.dayNum}</div>
                        {hasAgenda && <div className="text-[10px] mt-1">● Ocupado</div>}
                        {isToday && <div className="text-[10px] mt-1 font-bold">HOY</div>}
                      </button>
                    );
                  })}
                </div>
                {bulk.selectedDates.length > 0 && (
                  <div className="mt-4 p-3 bg-white rounded-lg border-2 border-green-300">
                    <p className="text-sm font-semibold text-green-800">
                      ✓ {bulk.selectedDates.length} día(s) seleccionado(s)
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Prefijo del título</label>
            <input type="text" value={bulk.titlePrefix} onChange={(e) => setBulk(b => ({ ...b, titlePrefix: e.target.value }))} className="w-full border border-gray-300 rounded-xl px-3 py-2.5" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Notas</label>
            <textarea value={bulk.notes} onChange={(e) => setBulk(b => ({ ...b, notes: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-xl px-3 py-2.5" />
          </div>
        </div>
        {bulk.assignee && bulk.region && bulk.stores.length > 0 && bulk.dateStart && bulk.dateEnd && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h4 className="font-bold text-gray-800">Vista previa de creación</h4>
            </div>
            <div className="text-sm text-gray-700 space-y-1">
              <p>👤 <strong>Promotor:</strong> {bulk.assignee.label}</p>
              <p>📍 <strong>Región:</strong> {bulk.region.label}</p>
              <p>🏪 <strong>Tiendas:</strong> {bulk.stores.length} seleccionada(s)</p>
              <p>📅 <strong>Fechas activas:</strong> {(() => {
                const dates = getDatesByWeekdays(bulk.dateStart, bulk.dateEnd, bulk.weekdays);
                return `${dates.length} día(s)`;
              })()}</p>
              <div className="mt-2 p-2 bg-white rounded border border-green-300">
                <p className="font-bold text-green-800">
                  Total a crear: {(() => {
                    const dates = getDatesByWeekdays(bulk.dateStart, bulk.dateEnd, bulk.weekdays);
                    return dates.length * bulk.stores.length;
                  })()} visita(s)
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  ({bulk.stores.length} tienda(s) × {(() => {
                    const dates = getDatesByWeekdays(bulk.dateStart, bulk.dateEnd, bulk.weekdays);
                    return dates.length;
                  })()} día(s))
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="mt-5 flex gap-3">
          <button type="submit" disabled={bulkLoading} className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg">
            {bulkLoading ? <FiRefreshCw className="w-5 h-5 animate-spin" /> : <FiPlus className="w-5 h-5" />} {bulkLoading ? 'Creando...' : 'Crear Agenda Semanal'}
          </button>
        </div>
      </form>
      {/* Lista */}
      <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Agenda Programada</h3>
          <span className="text-xs bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
            {filteredItems.length} elemento(s)
          </span>
        </div>
        {filteredItems.length === 0 ? (
          <div className="text-gray-500 text-sm">No hay elementos en la agenda</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filteredItems.map((it) => (
              <li key={it.id} className="py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-indigo-50/40 rounded-lg px-2 py-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-gray-900 truncate">{it.title}</span>
                      <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-medium ${
                        it.status === 'programado' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        it.status === 'pendiente' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          it.status === 'programado' ? 'bg-blue-600' :
                          it.status === 'pendiente' ? 'bg-yellow-600' :
                          'bg-gray-500'
                        }`} />
                        {it.status === 'pendiente' ? 'Pendiente' : 'Programado'}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                      <span className="inline-flex items-center gap-1">
                        <FiClock />
                        {(() => {
                          const dateStr = String(it.date).slice(0,10);
                          const dd = new Date(dateStr + 'T00:00:00');
                          const weekday = dd.toLocaleDateString('es-ES', { weekday: 'short' });
                          const day = dd.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                          return `${weekday} • ${day}`;
                        })()}
                      </span>
                      <span className="inline-flex items-center gap-1"><FiMapPin /> {it.region?.label} • {it.store?.label}</span>
                      <span className="inline-flex items-center gap-1"><FiUser /> {it.assignee?.label} <span className="text-gray-400">(ID: {it.assignee?.value})</span></span>
                    </div>
                    {it.notes && (
                      <p className="mt-2 text-sm text-gray-500">{it.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleDone(it.id)}
                      className="px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1"
                      title="Marcar como programado"
                    >
                      <FiCheck />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(it.id)}
                      className="px-3 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 flex items-center gap-1"
                      title="Eliminar"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AgendaManager;
