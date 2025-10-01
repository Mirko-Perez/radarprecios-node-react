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
    dateStart: "",
    dateEnd: "",
    weekdays: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false },
    titlePrefix: "Visita",
    notes: "",
  });
  const [showBulk, setShowBulk] = useState(false); // colapsar/expandir sección semanal
  const [showBulkAdvanced, setShowBulkAdvanced] = useState(false); // opciones avanzadas

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

    const loadAgendas = async () => {
      try {
        const res = await axios.get(`${API_URL}/agendas`, { headers: { Authorization: `Bearer ${token}` } });
        const list = res.data?.data || res.data || [];
        const normalized = list.map(a => ({
          id: a.agenda_id,
          title: a.title,
          date: a.date,
          region: { value: a.region_id, label: a.region_name },
          store: { value: a.store_id, label: a.store_name },
          assignee: { value: a.assignee_user_id, label: a.assignee_name || `Usuario ${a.assignee_user_id}` },
          notes: a.notes || "",
          status: a.status,
        }));
        setItems(normalized);
      } catch (e) {
        toast.error("No se pudieron cargar las agendas");
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

  // Cargar tiendas cuando cambia región
  // Cargar tiendas para selección semanal cuando cambia región
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
    if (!bulk.assignee || !bulk.region || !bulk.stores?.length || !bulk.dateStart || !bulk.dateEnd) {
      toast.error("Completa asignado, región, tiendas y rango de fechas");
      return;
    }
    const dates = getDatesByWeekdays(bulk.dateStart, bulk.dateEnd, bulk.weekdays);
    if (dates.length === 0) {
      toast.error("No hay fechas seleccionadas en los días marcados");
      return;
    }
    const items = [];
    for (const date of dates) {
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
      // refrescar listado
      const listRes = await axios.get(`${API_URL}/agendas`, { headers: { Authorization: `Bearer ${token}` } });
      const list = listRes.data?.data || listRes.data || [];
      const normalized = list.map(a => ({
        id: a.agenda_id,
        title: a.title,
        date: a.date,
        region: { value: a.region_id, label: a.region_name },
        store: { value: a.store_id, label: a.store_name },
        assignee: { value: a.assignee_user_id, label: a.assignee_name || `Usuario ${a.assignee_user_id}` },
        notes: a.notes || "",
        status: a.status,
      }));
      setItems(normalized);
    } catch (e) {
      toast.error(e?.response?.data?.message || "No se pudo crear agenda semanal");
    } finally {
      setBulkLoading(false);
    }
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
          <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <label className="text-sm font-bold text-gray-800">Periodo de Programación</label>
            </div>
            <p className="text-xs text-gray-600 mb-3">Define el rango de fechas para crear las visitas según los días marcados abajo</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">📅 Fecha de inicio</label>
                <input 
                  type="date" 
                  value={bulk.dateStart} 
                  onChange={(e) => setBulk(b => ({ ...b, dateStart: e.target.value }))} 
                  className="w-full border-2 border-gray-300 focus:border-blue-500 rounded-lg px-3 py-2.5 text-sm font-medium" 
                />
                {bulk.dateStart && (
                  <p className="text-xs text-blue-700 mt-1 font-medium">
                    Desde: {new Date(bulk.dateStart + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">🏁 Fecha de fin</label>
                <input 
                  type="date" 
                  value={bulk.dateEnd} 
                  onChange={(e) => setBulk(b => ({ ...b, dateEnd: e.target.value }))} 
                  min={bulk.dateStart}
                  className="w-full border-2 border-gray-300 focus:border-blue-500 rounded-lg px-3 py-2.5 text-sm font-medium" 
                />
                {bulk.dateEnd && (
                  <p className="text-xs text-blue-700 mt-1 font-medium">
                    Hasta: {new Date(bulk.dateEnd + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
            {bulk.dateStart && bulk.dateEnd && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-blue-300">
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold text-gray-800">
                    Duración: {Math.ceil((new Date(bulk.dateEnd) - new Date(bulk.dateStart)) / (1000 * 60 * 60 * 24)) + 1} día(s)
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Se crearán visitas en los días seleccionados dentro de este periodo
                </p>
              </div>
            )}
          </div>
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700">Días activos de visita</label>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setBulk(b => ({ ...b, weekdays: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false } }))}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                >
                  Lun-Vie
                </button>
                <button 
                  type="button"
                  onClick={() => setBulk(b => ({ ...b, weekdays: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: true } }))}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                >
                  Todos
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-600 mb-2">Marca los días en que quieres que se creen visitas dentro del periodo</p>
            <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
              {[
                { key: 'mon', label: 'Lun', full: 'Lunes' },
                { key: 'tue', label: 'Mar', full: 'Martes' },
                { key: 'wed', label: 'Mié', full: 'Miércoles' },
                { key: 'thu', label: 'Jue', full: 'Jueves' },
                { key: 'fri', label: 'Vie', full: 'Viernes' },
                { key: 'sat', label: 'Sáb', full: 'Sábado' },
                { key: 'sun', label: 'Dom', full: 'Domingo' },
              ].map(d => (
                <label key={d.key} title={d.full} className={`px-3 py-2.5 rounded-xl border-2 text-center cursor-pointer transition-all font-medium ${bulk.weekdays[d.key] ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-gray-300 text-gray-700 hover:border-indigo-300'}`}>
                  <input type="checkbox" className="hidden" checked={bulk.weekdays[d.key]} onChange={(e) => setBulk(b => ({ ...b, weekdays: { ...b.weekdays, [d.key]: e.target.checked } }))} />
                  {d.label}
                </label>
              ))}
            </div>
            {Object.values(bulk.weekdays).filter(Boolean).length > 0 && (
              <p className="text-xs text-green-700 mt-2 font-medium">
                ✓ {Object.values(bulk.weekdays).filter(Boolean).length} día(s) seleccionado(s)
              </p>
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
        <h3 className="text-lg font-bold text-gray-800 mb-4">Agenda Programada</h3>
        {filteredItems.length === 0 ? (
          <div className="text-gray-500 text-sm">No hay elementos en la agenda</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filteredItems.map((it) => (
              <li key={it.id} className="py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-gray-900">{it.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        it.status === "pendiente"
                          ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                          : "bg-green-50 text-green-700 border-green-200"
                      }`}>
                        {it.status === "pendiente" ? "Pendiente" : "Programado"}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-gray-600 flex flex-wrap gap-3">
                      <span className="inline-flex items-center gap-1"><FiClock /> {new Date(it.date).toLocaleDateString()}</span>
                      <span className="inline-flex items-center gap-1"><FiMapPin /> {it.region?.label} • {it.store?.label}</span>
                      <span className="inline-flex items-center gap-1"><FiUser /> {it.assignee?.label}</span>
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
