import { useContext, useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { FiCalendar, FiCheck, FiClock, FiFileText, FiMapPin, FiPlus, FiTrash2, FiUser, FiRefreshCw } from "react-icons/fi";
import axios from "axios";
import { toast } from "react-toastify";
import { AuthContext } from "../../../contexts/AuthContext";

// Simple, mobile-first agenda manager (local state). Later we can connect to backend.
const AgendaManager = () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  const { token } = useContext(AuthContext);

  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    title: "",
    date: "",
    region: null,
    store: null,
    assignee: null,
    notes: "",
  });
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
    store: null,
    dateStart: "",
    dateEnd: "",
    weekdays: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false },
    titlePrefix: "Visita",
    notes: "",
  });

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

  const resetForm = () => {
    setForm({ title: "", date: "", region: null, store: null, assignee: null, notes: "" });
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.region || !form.store || !form.assignee) return;

    try {
      setLoading(true);
      const res = await axios.post(
        `${API_URL}/agendas`,
        {
          title: form.title,
          date: form.date,
          region_id: form.region.value,
          store_id: form.store.value,
          assignee_user_id: form.assignee.value,
          notes: form.notes?.trim() || "",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const saved = res.data?.data || res.data;
      // Normalizar para la UI
      const normalized = {
        id: saved.agenda_id,
        title: saved.title,
        date: saved.date,
        region: { value: saved.region_id, label: saved.region_name || form.region.label },
        store: { value: saved.store_id, label: saved.store_name || form.store.label },
        assignee: users.find(u => u.value === form.assignee.value) || form.assignee,
        notes: saved.notes || "",
        status: saved.status || "pendiente",
      };
      setItems((prev) => [normalized, ...prev]);
      resetForm();
      toast.success("Agenda creada");
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudo crear la agenda");
    } finally {
      setLoading(false);
    }
  };

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

  // Cargar tiendas cuando cambia región
  useEffect(() => {
    const loadStores = async () => {
      if (!form.region?.value) { setStores([]); return; }
      try {
        const res = await axios.get(`${API_URL}/stores/region/${form.region.value}`, { headers: { Authorization: `Bearer ${token}` } });
        const storesData = res.data?.data || res.data || [];
        setStores(storesData.map(s => ({ value: s.store_id, label: s.store_name })));
      } catch (e) {
        toast.error("No se pudieron cargar tiendas");
      }
    };
    loadStores();
  }, [form.region?.value, token]);

  // Cargar tiendas para el formulario masivo cuando cambia bulk.region
  useEffect(() => {
    const loadStores = async () => {
      if (!bulk.region?.value) return;
      try {
        const res = await axios.get(`${API_URL}/stores/region/${bulk.region.value}`, { headers: { Authorization: `Bearer ${token}` } });
        const storesData = res.data?.data || res.data || [];
        // No pisamos el 'stores' del formulario normal para evitar interferencias; usamos el mismo options list reusado
      } catch (e) {
        // opcional: toasts
      }
    };
    loadStores();
  }, [bulk.region?.value, token]);

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
    if (!bulk.assignee || !bulk.region || !bulk.store || !bulk.dateStart || !bulk.dateEnd) {
      toast.error("Completa asignado, región, tienda y rango de fechas");
      return;
    }
    const dates = getDatesByWeekdays(bulk.dateStart, bulk.dateEnd, bulk.weekdays);
    if (dates.length === 0) {
      toast.error("No hay fechas seleccionadas en los días marcados");
      return;
    }
    const items = dates.map(date => ({
      title: `${bulk.titlePrefix} ${date}`,
      date,
      region_id: bulk.region.value,
      store_id: bulk.store.value,
      notes: bulk.notes?.trim() || "",
    }));
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

      {/* Formulario */}
      <form onSubmit={addItem} className="bg-white rounded-2xl shadow p-4 sm:p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Nueva Visita / Trayectoria</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Título</label>
            <div className="relative">
              <FiFileText className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ej: Ruta Oriente - Tienda A"
                className="w-full border border-gray-300 rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha</label>
            <div className="relative">
              <FiCalendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Región</label>
            <div className="relative">
              <FiMapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <div className="pl-7">
                <Select
                  styles={customSelectStyles}
                  options={regiones}
                  value={form.region}
                  onChange={(opt) => setForm((f) => ({ ...f, region: opt, store: null }))}
                  placeholder={loadingCatalogs ? "Cargando regiones..." : "Selecciona región"}
                  isDisabled={loadingCatalogs}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tienda</label>
            <div className="relative">
              <FiMapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <div className="pl-7">
                <Select
                  styles={customSelectStyles}
                  options={stores}
                  value={form.store}
                  onChange={(opt) => setForm((f) => ({ ...f, store: opt }))}
                  placeholder={!form.region ? "Primero selecciona región" : stores.length === 0 ? "Sin tiendas" : "Selecciona tienda"}
                  isDisabled={!form.region}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Asignar a</label>
            <div className="relative">
              <FiUser className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <div className="pl-7">
                <Select
                  styles={customSelectStyles}
                  options={users}
                  value={form.assignee}
                  onChange={(opt) => setForm((f) => ({ ...f, assignee: opt }))}
                  placeholder={loadingCatalogs ? "Cargando usuarios..." : "Selecciona usuario"}
                  isDisabled={loadingCatalogs}
                />
              </div>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Notas</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              placeholder="Indicaciones de la visita, objetivos, etc."
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <FiRefreshCw className="w-5 h-5 animate-spin" /> : <FiPlus className="w-5 h-5" />} {loading ? "Creando..." : "Crear"}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
          >
            Limpiar
          </button>
        </div>
      </form>

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
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tienda</label>
            <Select
              styles={customSelectStyles}
              options={stores}
              value={bulk.store}
              onChange={(opt) => setBulk((b) => ({ ...b, store: opt }))}
              placeholder={!bulk.region ? "Primero selecciona región" : stores.length === 0 ? "Sin tiendas" : "Selecciona tienda"}
              isDisabled={!bulk.region}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Rango de fechas</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={bulk.dateStart} onChange={(e) => setBulk(b => ({ ...b, dateStart: e.target.value }))} className="border border-gray-300 rounded-xl px-3 py-2.5" />
              <input type="date" value={bulk.dateEnd} onChange={(e) => setBulk(b => ({ ...b, dateEnd: e.target.value }))} className="border border-gray-300 rounded-xl px-3 py-2.5" />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Días de la semana</label>
            <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
              {[
                { key: 'mon', label: 'Lun' },
                { key: 'tue', label: 'Mar' },
                { key: 'wed', label: 'Mié' },
                { key: 'thu', label: 'Jue' },
                { key: 'fri', label: 'Vie' },
                { key: 'sat', label: 'Sáb' },
                { key: 'sun', label: 'Dom' },
              ].map(d => (
                <label key={d.key} className={`px-3 py-2 rounded-xl border text-center cursor-pointer ${bulk.weekdays[d.key] ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                  <input type="checkbox" className="hidden" checked={bulk.weekdays[d.key]} onChange={(e) => setBulk(b => ({ ...b, weekdays: { ...b.weekdays, [d.key]: e.target.checked } }))} />
                  {d.label}
                </label>
              ))}
            </div>
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
        <div className="mt-5 flex gap-3">
          <button type="submit" disabled={bulkLoading} className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60">
            {bulkLoading ? <FiRefreshCw className="w-5 h-5 animate-spin" /> : <FiPlus className="w-5 h-5" />} {bulkLoading ? 'Creando...' : 'Crear Semana'}
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
