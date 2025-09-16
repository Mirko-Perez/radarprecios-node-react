import axios from "axios";
import { useEffect, useRef, useState } from "react";

const CrearProducto = ({ onCancel }) => {
  const imageInputRef = useRef(null);
  const [nombre, setNombre] = useState("");
  const [regionId, setRegionId] = useState("");
  const [storeId, setStoreId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [grupoId, setGrupoId] = useState("");
  const [imagen, setImagen] = useState(null);
  const [preview, setPreview] = useState("");
  const [regiones, setRegiones] = useState([]);
  const [stores, setStores] = useState([]);
  const [brands, setBrands] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingStores, setLoadingStores] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

  useEffect(() => {
    const fetchRegiones = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/regions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRegiones(res.data.data || []);
      } catch (err) {
        console.error(err);
        setError("Error al cargar las regiones");
      } finally {
        setLoading(false);
      }
    };
    fetchRegiones();
  }, [API_URL]);

  useEffect(() => {
    const fetchStores = async () => {
      if (!regionId) {
        setStores([]);
        setStoreId("");
        setBrands([]);
        setBrandId("");
        return;
      }
      setLoadingStores(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/stores/region/${regionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStores(res.data || []);
      } catch (err) {
        console.error(err);
        setError("Error al cargar las tiendas");
      } finally {
        setLoadingStores(false);
      }
    };
    fetchStores();
  }, [regionId, API_URL]);

  useEffect(() => {
    const fetchBrands = async () => {
      if (!storeId) {
        setBrands([]);
        setBrandId("");
        return;
      }
      setLoadingBrands(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/brands/store/${storeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBrands(res.data.data || []);
      } catch (err) {
        console.error(err);
        setError("Error al cargar las marcas");
      } finally {
        setLoadingBrands(false);
      }
    };
    fetchBrands();
  }, [storeId, API_URL]);

  useEffect(() => {
    const fetchGrupos = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/groups`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGrupos(res.data.data || []);
        if (res.data && res.data.length > 0) setGrupoId(res.data[0].group_id);
      } catch (err) {
        console.error(err);
        setError("Error al cargar los grupos");
      }
    };
    fetchGrupos();
  }, [API_URL]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagen(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre || !regionId || !storeId || !brandId || !grupoId || !imagen) {
      setError("Completa todos los campos obligatorios");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("product_name", nombre.trim());
      formData.append("brand_id", brandId);
      formData.append("region_id", regionId);
      formData.append("group_id", grupoId);
      formData.append("imagen", imagen);

      await axios.post(`${API_URL}/products`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess("Producto creado exitosamente");
      setNombre("");
      setRegionId("");
      setStoreId("");
      setBrandId("");
      setGrupoId("");
      setImagen(null);
      setPreview("");
      if (imageInputRef.current) imageInputRef.current.value = "";
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error al crear el producto");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-6">Cargando...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg mt-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Crear Nuevo Producto
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          {success}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="region"
              className="block text-gray-700 font-medium mb-1"
            >
              Región *
            </label>
            <select
              id="region"
              value={regionId}
              onChange={(e) => {
                setRegionId(e.target.value);
                setStoreId("");
                setBrandId("");
              }}
              disabled={submitting}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccione una región</option>
              {regiones.map((r) => (
                <option key={r.region_id} value={r.region_id}>
                  {r.region_name}
                </option>
              ))}
            </select>
            {loadingStores && (
              <p className="text-sm text-gray-500 mt-1">
                Cargando comercios...
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="comercio"
              className="block text-gray-700 font-medium mb-1"
            >
              Comercio *
            </label>
            <select
              id="comercio"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              disabled={!regionId || loadingStores || submitting}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccione un comercio</option>
              {stores.map((s) => (
                <option key={s.store_id} value={s.store_id}>
                  {s.store_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="marca"
              className="block text-gray-700 font-medium mb-1"
            >
              Marca *
            </label>
            <select
              id="marca"
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              disabled={!storeId || loadingBrands || submitting}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccione una marca</option>
              {brands.map((b) => (
                <option key={b.brand_id} value={b.brand_id}>
                  {b.brand_name}
                </option>
              ))}
            </select>
            {loadingBrands && (
              <p className="text-sm text-gray-500 mt-1">Cargando marcas...</p>
            )}
          </div>

          <div>
            <label
              htmlFor="grupo"
              className="block text-gray-700 font-medium mb-1"
            >
              Grupo *
            </label>
            <select
              id="grupo"
              value={grupoId}
              onChange={(e) => setGrupoId(e.target.value)}
              disabled={submitting}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {grupos.map((g) => (
                <option key={g.group_id} value={g.group_id}>
                  {g.group_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="producto"
            className="block text-gray-700 font-medium mb-1"
          >
            Nombre del Producto *
          </label>
          <input
            id="producto"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={submitting}
            placeholder="Ingrese el nombre del producto"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="imagen"
            className="block text-gray-700 font-medium mb-1"
          >
            Imagen *
          </label>
          <input
            id="imagen"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            ref={imageInputRef}
            disabled={submitting}
            className="w-full"
          />
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="mt-2 w-48 h-48 object-cover rounded-md mx-auto"
            />
          )}
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
          >
            Volver
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
          >
            {submitting ? (
              <span className="loader border-t-2 border-b-2 border-white w-4 h-4 rounded-full animate-spin"></span>
            ) : (
              "Guardar Producto"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CrearProducto;
