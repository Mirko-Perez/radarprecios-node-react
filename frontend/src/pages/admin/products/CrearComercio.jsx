import axios from "axios";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

const CrearComercio = ({ onCancel, editData, onSuccess }) => {
  const [nombre, setNombre] = useState("");
  const [regionId, setRegionId] = useState("");
  const [regiones, setRegiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/";

  // Cargar regiones y inicializar campos si se está editando
  useEffect(() => {
    const fetchRegiones = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_URL}/regions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRegiones(response.data.data || []);

        if (editData) {
          setNombre(editData.store_name || "");
          setRegionId(editData.region_id || "");
        }
      } catch (err) {
        console.error("Error fetching regions:", err);
        Swal.fire("Error", "No se pudieron cargar las regiones", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchRegiones();
  }, [API_URL, editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !regionId) {
      Swal.fire("Error", "Por favor completa todos los campos", "warning");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      if (editData) {
        // Editar
        await axios.put(
          `${API_URL}/stores/${editData.store_id}`,
          { store_name: nombre.trim(), region_id: Number(regionId) },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        Swal.fire("Éxito", "Comercio actualizado correctamente", "success");
      } else {
        // Crear
        await axios.post(
          `${API_URL}/stores`,
          { store_name: nombre.trim(), region_id: Number(regionId) },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        Swal.fire("Éxito", "Comercio creado correctamente", "success");
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      Swal.fire(
        "Error",
        err.response?.data?.message || "Error al guardar el comercio",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {editData ? "Editar Comercio" : "Crear Nuevo Comercio"}
      </h2>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="flex flex-col">
          <label htmlFor="region" className="font-medium text-gray-700 mb-1">
            Región:
          </label>
          <select
            id="region"
            value={regionId}
            onChange={(e) => setRegionId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={submitting}
            required
          >
            <option value="">Selecciona una región</option>
            {regiones.map((region) => (
              <option key={region.region_id} value={region.region_id}>
                {region.region_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label htmlFor="nombre" className="font-medium text-gray-700 mb-1">
            Nombre del Comercio:
          </label>
          <input
            type="text"
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={submitting}
            required
          />
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            {submitting ? "Guardando..." : editData ? "Actualizar" : "Crear"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CrearComercio;
