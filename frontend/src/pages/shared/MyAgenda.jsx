import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "../../contexts/AuthContext";
import { FiCalendar, FiClock, FiMapPin } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const weekday = (dStr) => {
  const d = new Date(dStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "long" });
};

const formatDate = (dStr) => {
  const d = new Date(dStr + "T00:00:00");
  return d.toLocaleDateString();
};

const MyAgenda = () => {
  const { token } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadWeek = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${API_URL}/agendas/assigned/week`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data?.data || res.data || [];
        setItems(data);
      } catch (e) {
        setError(e?.response?.data?.message || "No se pudo cargar tu agenda");
      } finally {
        setLoading(false);
      }
    };
    if (token) loadWeek();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <div className="flex items-center gap-3 text-white">
              <FiCalendar className="w-6 h-6" />
              <h2 className="text-2xl font-bold">Mi Agenda (Semana)</h2>
            </div>
          </div>

          <div className="p-6">
            {loading && (
              <div className="text-center text-gray-600">Cargando...</div>
            )}
            {error && (
              <div className="p-4 rounded-xl mb-4 bg-red-50 text-red-700 border border-red-200">{error}</div>
            )}

            {(!loading && items.length === 0) ? (
              <div className="text-gray-600 text-sm">No tienes visitas asignadas esta semana.</div>
            ) : (
              <ul className="space-y-4">
                {items.map((it) => (
                  <li key={it.agenda_id} className="p-4 rounded-xl border bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <FiClock />
                        <span className="capitalize">{weekday(it.date)}</span>
                        <span>• {formatDate(it.date)}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        it.status === 'completado' ? 'bg-green-50 text-green-700 border-green-200' :
                        it.status === 'iniciado' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        it.status === 'no_ejecutado' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>
                        {it.status}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="text-base font-semibold text-gray-900">{it.title}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                        <FiMapPin />
                        <span>{it.region_name} • {it.store_name}</span>
                      </div>
                      {it.notes && <p className="text-sm text-gray-500 mt-2">{it.notes}</p>}
                      {it.justification && (
                        <p className="text-xs mt-2 text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                          Justificación: {it.justification}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyAgenda;
