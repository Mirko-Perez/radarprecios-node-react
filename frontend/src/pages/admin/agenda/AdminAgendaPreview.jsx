import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../contexts/AuthContext";
import { FiCalendar, FiChevronDown, FiChevronUp, FiExternalLink, FiMapPin, FiUser, FiFilter, FiRefreshCw } from "react-icons/fi";
import Select from "react-select";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Format date to YYYY-MM-DD using local time (avoid timezone shifts)
function ymdLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getWeekRange(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diffToMonday = (day + 6) % 7; // map Sun(0)->6, Mon(1)->0, ...
  const monday = new Date(d);
  monday.setDate(d.getDate() - diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { monday, sunday, mondayStr: ymdLocal(monday), sundayStr: ymdLocal(sunday) };
}

const AdminAgendaPreview = () => {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState({}); // userId -> boolean
  const [userWeek, setUserWeek] = useState({}); // userId -> agenda items[]
  const [search, setSearch] = useState("");
  const [regiones, setRegiones] = useState([]);
  const [regionFilter, setRegionFilter] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [calendarData, setCalendarData] = useState(null); // { [date]: [{it, user}] }
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'summary'
  const [showJustificationsModal, setShowJustificationsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [justifications, setJustifications] = useState([]);

  const { mondayStr, sundayStr } = useMemo(() => getWeekRange(new Date()), []);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${API_URL}/admin/usuarios`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data?.data || res.data || [];
        const onlyPromoters = (Array.isArray(data) ? data : []).filter((u) => {
          const pid = u.permission_id ?? u.permissionId;
          const hasRole = Array.isArray(u.permissions) && u.permissions.includes('promoter');
          return pid === 4 || hasRole;
        });
        setUsers(onlyPromoters);
      } catch (e) {
        setError(e?.response?.data?.message || "No se pudieron cargar usuarios");
      } finally {
        setLoading(false);
      }
    };
    const loadRegions = async () => {
      try {
        const res = await axios.get(`${API_URL}/regions`, { headers: { Authorization: `Bearer ${token}` } });
        const data = res.data?.data || res.data || [];
        setRegiones(data.map(r => ({ value: r.region_id, label: r.region_name })));
      } catch {}
    };
    if (token) { loadUsers(); loadRegions(); }
  }, [token]);

  // Cuando cambia el filtro de región, invalidar cache y recargar fuentes de la pestaña activa
  useEffect(() => {
    if (!users.length) return;
    setUserWeek({});
    setSummary(null);
    setCalendarData(null);
    if (activeTab === 'summary') {
      loadWeeklySummary();
    } else if (activeTab === 'calendar') {
      loadWeeklyCalendar();
    }
    // Refetch for expanded users so the filter applies without manual toggle
    const refetchExpanded = async () => {
      const ids = Object.keys(expanded).filter((k) => expanded[k]);
      if (!ids.length) return;
      for (const id of ids) {
        try {
          const res = await axios.get(`${API_URL}/agendas`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { assignee_user_id: id },
          });
          const raw = res.data?.data || res.data || [];
          // Normalizar fecha igual que en loadWeeklyCalendar
          let list = raw
            .map((it) => ({ ...it, date: String(it.date).slice(0, 10) }))
            .filter((it) => it.date >= mondayStr && it.date <= sundayStr);
          if (regionFilter?.value) {
            list = list.filter((it) => {
              const rid = Number(it.region_id);
              return rid === Number(regionFilter.value);
            });
          }
          setUserWeek((prev) => ({ ...prev, [id]: list }));
        } catch {}
      }
    };
    refetchExpanded();
  }, [regionFilter, users]);

  // Auto-load data for the active tab when users list changes or when data is cleared
  useEffect(() => {
    if (!users.length) return;
    if (activeTab === 'calendar' && !calendarData && !calendarLoading) {
      loadWeeklyCalendar();
    }
    if (activeTab === 'summary' && !summary && !summaryLoading) {
      loadWeeklySummary();
    }
  }, [users, activeTab, calendarData, summary]);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const s = search.trim().toLowerCase();
    return users.filter((u) =>
      [u.username, u.email, u.first_name, u.last_name]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(s))
    );
  }, [users, search]);

  const toggleExpand = async (user) => {
    const newState = !expanded[user.user_id];
    setExpanded((prev) => ({ ...prev, [user.user_id]: newState }));
    if (newState && !userWeek[user.user_id]) {
      try {
        const res = await axios.get(`${API_URL}/agendas`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { assignee_user_id: user.user_id },
        });
        const raw = res.data?.data || res.data || [];
        // Normalizar fecha y filtro cliente por semana actual
        let inWeek = raw
          .map((it) => ({ ...it, date: String(it.date).slice(0, 10) }))
          .filter((it) => it.date >= mondayStr && it.date <= sundayStr);
        if (regionFilter?.value) {
          inWeek = inWeek.filter((it) => Number(it.region_id) === Number(regionFilter.value));
        }
        setUserWeek((prev) => ({ ...prev, [user.user_id]: inWeek }));
      } catch (e) {
        setUserWeek((prev) => ({ ...prev, [user.user_id]: [] }));
      }
    }
  };

  const loadJustifications = async (user) => {
    setSelectedUser(user);
    try {
      const res = await axios.get(`${API_URL}/agendas`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { assignee_user_id: user.user_id, status: 'no_ejecutado' },
      });
      const list = res.data?.data || res.data || [];
      const inWeek = list.filter((it) => it.date >= mondayStr && it.date <= sundayStr && it.justification);
      setJustifications(inWeek);
      setShowJustificationsModal(true);
    } catch (e) {
      setJustifications([]);
      setShowJustificationsModal(true);
    }
  };

  const loadWeeklySummary = async () => {
    setSummaryLoading(true);
    try {
      const result = [];
      for (const u of users) {
        try {
          const res = await axios.get(`${API_URL}/agendas`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { assignee_user_id: u.user_id },
          });
          let list = res.data?.data || res.data || [];
          list = list.filter((it) => it.date >= mondayStr && it.date <= sundayStr);
          if (regionFilter?.value) {
            list = list.filter((it) => Number(it.region_id) === Number(regionFilter.value));
          }
          const counts = list.reduce((acc, it) => {
            acc.total++;
            acc[it.status] = (acc[it.status] || 0) + 1;
            return acc;
          }, { total: 0 });
          result.push({ user: u, counts });
        } catch {}
      }
      setSummary(result);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleRefresh = () => {
    // Invalidar cache y recargar según pestaña activa
    setUserWeek({});
    setSummary(null);
    setCalendarData(null);
    if (activeTab === 'calendar') {
      loadWeeklyCalendar();
    } else if (activeTab === 'summary') {
      loadWeeklySummary();
    }
  };

  const loadWeeklyCalendar = async () => {
    setCalendarLoading(true);
    try {
      const map = {};
      for (const u of users) {
        try {
          const res = await axios.get(`${API_URL}/agendas`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { assignee_user_id: u.user_id },
          });
          const raw = res.data?.data || res.data || [];
          // Normalizar fecha a parte de fecha (YYYY-MM-DD) para evitar TZ/hora
          let list = raw
            .map((it) => ({ ...it, datePart: String(it.date).slice(0, 10) }))
            .filter((it) => it.datePart >= mondayStr && it.datePart <= sundayStr);
          if (regionFilter?.value) {
            list = list.filter((it) => Number(it.region_id) === Number(regionFilter.value));
          }
          for (const it of list) {
            const dateKey = it.datePart;
            if (!map[dateKey]) map[dateKey] = [];
            map[dateKey].push({ it, user: u });
          }
        } catch {}
      }
      setCalendarData(map);
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleAssignWeek = (user) => {
    // Navegar a /agenda y prefijar el "Asignar a"
    const label = user.username || `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email;
    navigate("/agenda", { state: { prefillAssignee: { value: user.user_id, label } } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidde p-5">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Agenda • Vista Admin</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg font-medium flex items-center gap-2 transition-all"
                  title="Actualizar datos"
                >
                  <FiRefreshCw className="w-4 h-4" />
                  Actualizar
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/menu')}
                  className="px-4 py-2 bg-white text-indigo-700 hover:bg-indigo-50 rounded-lg font-medium"
                  title="Volver al Panel Admin"
                >
                  ← Volver
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-4 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar usuario (nombre, email)"
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <div className="flex gap-3">
                <div className="min-w-[220px]">
                  <Select
                    options={regiones}
                    value={regionFilter}
                    onChange={(opt) => { setRegionFilter(opt || null); }}
                    placeholder="Filtrar por región"
                    isClearable
                  />
                </div>
                <div className="bg-gray-100 rounded-xl p-1 flex">
                  <button
                    type="button"
                    onClick={() => { 
                      setActiveTab('calendar'); 
                      if (!calendarData) loadWeeklyCalendar(); 
                    }}
                    className={`px-3 mx-1 py-1.5 rounded-lg text-sm font-medium ${activeTab==='calendar' ? 'bg-indigo-600 text-white shadow' : 'text-gray-700 hover:bg-indigo-50'}`}
                  >Calendario</button>
                  <button
                    type="button"
                    onClick={() => { 
                      setActiveTab('summary'); 
                      if (!summary) loadWeeklySummary(); 
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeTab==='summary' ? 'bg-indigo-600 text-white shadow' : 'text-gray-700 hover:bg-indigo-50'}`}
                  >Resumen</button>
                </div>
                <button
                  type="button"
                  onClick={() => { setSummary(null); setUserWeek({}); setCalendarData(null); }}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
                >
                  Limpiar
                </button>
              </div>
            </div>

            {/* Tabs content */}
            {activeTab === 'calendar' && (
              <div className="mb-4">
                {regionFilter && (
                  <div className="mb-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <p className="text-sm text-indigo-800">
                      📍 Mostrando visitas de la región: <span className="font-semibold">{regionFilter.label}</span>
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
                  {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map((label, idx) => {
                    // calcular fecha desde mondayStr usando fecha local
                    const start = new Date(mondayStr + 'T00:00:00');
                    const d = new Date(start);
                    d.setDate(start.getDate() + idx);
                    const dateStr = ymdLocal(d); // Usar ymdLocal para consistencia
                    const items = calendarData?.[dateStr] || [];
                    const todayStr = ymdLocal(new Date());
                    const isToday = dateStr === todayStr;
                    
                    // Debug: mostrar total de items en calendarData
                    const totalItems = calendarData ? Object.keys(calendarData).reduce((sum, key) => sum + (calendarData[key]?.length || 0), 0) : 0;
                    
                    return (
                      <div key={label} className={`border-2 rounded-xl p-3 min-h-[140px] ${isToday ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}`}>
                        <div className="text-sm font-semibold text-gray-800 mb-2 flex items-center justify-between">
                          <span>{label}</span>
                          {isToday && <span className="text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded-full">HOY</span>}
                        </div>
                        <div className="text-xs text-gray-600 mb-2">{d.getDate()}/{d.getMonth()+1}</div>
                        {calendarLoading ? (
                          <div className="text-xs text-gray-500">Cargando...</div>
                        ) : !calendarData ? (
                          <div className="text-xs text-gray-400">Click en Actualizar</div>
                        ) : items.length === 0 ? (
                          <div className="text-xs text-gray-400">
                            Sin visitas
                            {totalItems > 0 && <div className="text-[10px] text-gray-400 mt-1">({totalItems} total semana)</div>}
                          </div>
                        ) : (
                          <ul className="space-y-2">
                            {items.map(({ it, user }) => (
                              <li key={it.agenda_id} className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-800 rounded px-2 py-1">
                                <div className="font-medium truncate">{it.title}</div>
                                <div className="truncate">{it.region_name} • {it.store_name}</div>
                                <div className="truncate text-[11px] text-indigo-700">{user.username || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email}</div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'summary' && summary && (
              <div className="mb-4 bg-white border rounded-xl overflow-hidden">
                <div className="px-4 py-2 border-b bg-gray-50 text-sm font-semibold">Visitas generales de la semana {mondayStr} — {sundayStr}{regionFilter ? ` • Región: ${regionFilter.label}` : ''}</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600">
                        <th className="px-4 py-2">Promotor</th>
                        <th className="px-4 py-2">Total</th>
                        <th className="px-4 py-2">pendiente</th>
                        <th className="px-4 py-2">programado</th>
                        <th className="px-4 py-2">iniciado</th>
                        <th className="px-4 py-2">completado</th>
                        <th className="px-4 py-2">no_ejecutado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.map(({ user: u, counts }) => (
                        <tr key={u.user_id} className="border-t">
                          <td className="px-4 py-2">{u.username || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email}</td>
                          <td className="px-4 py-2 font-semibold">{counts.total || 0}</td>
                          <td className="px-4 py-2">{counts.pendiente || 0}</td>
                          <td className="px-4 py-2">{counts.programado || 0}</td>
                          <td className="px-4 py-2">{counts.iniciado || 0}</td>
                          <td className="px-4 py-2">{counts.completado || 0}</td>
                          <td className="px-4 py-2">{counts.no_ejecutado || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

            {loading && <div className="text-gray-600">Cargando usuarios...</div>}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 mb-4">{error}</div>
            )}

            {!loading && filteredUsers.length === 0 && (
              <div className="text-sm text-gray-600">No hay usuarios para mostrar.</div>
            )}

            <ul className="divide-y divide-gray-100">
              {filteredUsers.map((u) => (
                <li key={u.user_id} className="py-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-gray-900 flex items-center gap-2">
                          <FiUser /> {u.username || `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email}
                        </span>
                        <span className="text-xs text-gray-500">ID: {u.user_id}</span>
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        {u.email && <span className="mr-2">{u.email}</span>}
                        {/* permiso ocultado por requerimiento */}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAssignWeek(u)}
                        className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                        title="Asignar agenda semanal"
                      >
                        Asignar semana
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleExpand(u)}
                        className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 flex items-center gap-1"
                        title="Ver semana actual"
                      >
                        {expanded[u.user_id] ? <FiChevronUp /> : <FiChevronDown />} Ver semana
                      </button>
                      <button
                        type="button"
                        onClick={() => loadJustifications(u)}
                        className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1"
                        title="Ver justificaciones"
                      >
                        Ver justificaciones
                      </button>
                    </div>
                  </div>

                  {expanded[u.user_id] && (
                    <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
                      {!userWeek[u.user_id] ? (
                        <div className="text-sm text-gray-600">Cargando semana...</div>
                      ) : userWeek[u.user_id].length === 0 ? (
                        <div className="text-sm text-gray-600">Sin visitas programadas entre {mondayStr} y {sundayStr}.</div>
                      ) : (
                        (() => {
                          const grouped = userWeek[u.user_id].reduce((acc, it) => {
                            (acc[it.date] = acc[it.date] || []).push(it);
                            return acc;
                          }, {});
                          const days = Object.keys(grouped).sort();
                          return (
                            <div className="space-y-3">
                              {days.map((d) => (
                                <div key={d} className="bg-white border rounded-lg">
                                  <div className="px-3 py-2 border-b bg-gray-50">
                                    <div className="flex items-center justify-between">
                                      <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                        <FiCalendar />
                                        {(() => {
                                          const dd = new Date(d + 'T00:00:00');
                                          const weekday = dd.toLocaleDateString('es-ES', { weekday: 'long' });
                                          const dayNum = dd.toLocaleDateString('es-ES', { day: 'numeric' });
                                          const month = dd.toLocaleDateString('es-ES', { month: 'short' });
                                          return `${weekday} • ${dayNum} ${month}`;
                                        })()}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="hidden sm:inline text-xs text-gray-500">Agenda programada — <span className="font-medium text-gray-700">{u.username || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email}</span> <span className="text-gray-400">(ID: {u.user_id})</span></span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">{grouped[d].length} visita(s)</span>
                                      </div>
                                    </div>
                                  </div>
                                  <ul className="divide-y">
                                    {grouped[d].map((it) => (
                                      <li key={it.agenda_id} className="px-3 py-2 flex items-center justify-between hover:bg-indigo-50/40">
                                        <div className="min-w-0">
                                          <div className="text-sm font-semibold text-gray-900 truncate">{it.title}</div>
                                          <div className="text-xs text-gray-600 flex items-center gap-2 mt-0.5">
                                            <FiMapPin className="text-indigo-600" /> <span className="truncate">{it.region_name} • {it.store_name}</span>
                                          </div>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-medium ${
                                          it.status === 'completado' ? 'bg-green-50 text-green-700 border-green-200' :
                                          it.status === 'iniciado' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                          it.status === 'no_ejecutado' ? 'bg-red-50 text-red-700 border-red-200' :
                                          'bg-yellow-50 text-yellow-700 border-yellow-200'
                                        }`}>
                                          <span className={`w-1.5 h-1.5 rounded-full ${
                                            it.status === 'completado' ? 'bg-green-600' :
                                            it.status === 'iniciado' ? 'bg-blue-600' :
                                            it.status === 'no_ejecutado' ? 'bg-red-600' :
                                            'bg-yellow-600'
                                          }`} />
                                          {it.status === 'pendiente' ? 'programado' : it.status}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          );
                        })()
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {showJustificationsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl m-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b bg-gradient-to-r from-amber-50 to-orange-50">
              <h3 className="text-xl font-bold text-gray-800">Justificaciones de visitas no ejecutadas</h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedUser?.username} - Semana del {mondayStr} al {sundayStr}
              </p>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {justifications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-5xl mb-3">✓</div>
                  <p className="text-gray-600">No hay visitas justificadas esta semana</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {justifications.map((just) => (
                    <div key={just.agenda_id} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">{just.title}</h4>
                          <div className="text-sm text-gray-600 mt-1 flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <FiCalendar className="w-4 h-4" />
                              {just.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <FiMapPin className="w-4 h-4" />
                              {just.region_name} • {just.store_name}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">No ejecutado</span>
                      </div>
                      <div className="bg-white border border-amber-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Justificación:</p>
                        <p className="text-sm text-gray-800">{just.justification}</p>
                        {just.attempted_store_id && (
                          <p className="text-xs text-gray-500 mt-2">
                            PDV intentado: ID {just.attempted_store_id}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowJustificationsModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
  );
};

export default AdminAgendaPreview;
