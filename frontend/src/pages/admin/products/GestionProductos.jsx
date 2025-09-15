import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../../contexts/AuthContext";
import Swal from "sweetalert2";
import DataTable from "../../../components/forms/DataTable";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const GestionProductos = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    nombre: "",
    marca: "",
    region: "",
  });
  const [brands, setBrands] = useState([]);
  const [regions, setRegions] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.permissionId > 2) {
      navigate("/unauthorized");
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const [productsRes, brandsRes, regionsRes] = await Promise.allSettled([
          axios.get(`${API_URL}/products`),
          axios.get(`${API_URL}/brands`),
          axios.get(`${API_URL}/regions`).catch(() => ({ data: [] })),
        ]);

        if (productsRes.status === "fulfilled") {
          setProducts(productsRes.value.data);
          setFilteredProducts(productsRes.value.data);
        } else {
          throw new Error("Error al cargar los productos");
        }

        if (brandsRes.status === "fulfilled") {
          setBrands(brandsRes.value.data);
        }

        if (regionsRes.status === "fulfilled") {
          setRegions(regionsRes.value.data || []);
        }
      } catch (err) {
        setError("Error al cargar los datos. Por favor, intente de nuevo.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let result = [...products];
    if (filters.nombre) {
      result = result.filter((p) =>
        p.product_name.toLowerCase().includes(filters.nombre.toLowerCase())
      );
    }
    if (filters.marca) {
      result = result.filter((p) => p.brand_id.toString() === filters.marca);
    }
    if (filters.region) {
      result = result.filter((p) => p.region_id.toString() === filters.region);
    }
    setFilteredProducts(result);
  }, [filters, products]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (product) => {
    Swal.fire({
      title: `¿Seguro que deseas ${product.is_valid ? "deshabilitar" : "habilitar"} este producto?`,
      text: !product.is_valid
        ? "⚠️ Al habilitar este producto, también se habilitarán sus precios asociados."
        : "",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: product.is_valid ? "Sí, deshabilitar" : "Sí, habilitar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: product.is_valid ? "#d33" : "#16a34a",
      cancelButtonColor: "#6b7280",
    }).then((result) => {
      if (result.isConfirmed) {
        confirmStatusChange(product);
      }
    });
  };

  const confirmStatusChange = async (product) => {
    try {
      const newStatus = !product.is_valid;
      const response = await axios.put(
        `${API_URL}/products/${product.product_id}/status`,
        { is_valid: newStatus },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.status === 200) {
        setProducts(
          products.map((p) =>
            p.product_id === product.product_id ? { ...p, is_valid: newStatus } : p
          )
        );

        toast.success(
          `Producto ${newStatus ? "habilitado" : "deshabilitado"} correctamente`
        );
      }
    } catch {
      toast.error("Error al actualizar el estado del producto");
    }
  };

  const getBrandName = (id) =>
    brands.find((b) => b.brand_id === id)?.brand_name || "N/A";
  
  const getRegionName = (id) =>
    regions.find((r) => r.region_id === id)?.region_name || "N/A";

  // Configuración de columnas para la tabla
  const tableColumns = [
    {
      key: 'imagen',
      title: 'Imagen',
      width: '80px',
      render: (value, product) => (
        value ? (
          <img
            src={`${API_URL}${value}`}
            alt={product.product_name}
            className="w-12 h-12 object-cover rounded"
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/50";
            }}
          />
        ) : (
          <div className="w-12 h-12 bg-gray-100 flex items-center justify-center text-gray-400 rounded">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 4a1 1 0 011-1h4.586a1 1 0 01.707.293l1.414 1.414A1 1 0 0011.414 5H20a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4z"
              />
            </svg>
          </div>
        )
      )
    },
    {
      key: 'product_name',
      title: 'Nombre'
    },
    {
      key: 'brand_id',
      title: 'Marca',
      render: (brandId) => getBrandName(brandId)
    },
    {
      key: 'region_id',
      title: 'Región',
      render: (regionId) => getRegionName(regionId)
    },
    {
      key: 'group_name',
      title: 'Grupo',
      render: (value) => value || "N/A"
    },
    {
      key: 'is_valid',
      title: 'Estado',
      render: (isValid) => (
        <span
          className={`px-2 py-1 rounded text-white text-xs ${
            isValid ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {isValid ? "Activo" : "Inactivo"}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Acciones',
      render: (_, product) => (
        <button
          onClick={() => handleStatusChange(product)}
          className={`px-3 py-1 rounded text-white text-sm hover:opacity-90 transition ${
            product.is_valid ? "bg-red-500" : "bg-green-500"
          }`}
        >
          {product.is_valid ? "Deshabilitar" : "Habilitar"}
        </button>
      )
    }
  ];

  // Filtrar productos no eliminados
  const tableData = filteredProducts
    .filter((p) => !p.deleted)
    .map(product => ({
      ...product,
      id: product.product_id // Para el key único en la tabla
    }));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Filtros */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 mb-6">
        <h5 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
          🔍 Filtros de búsqueda
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Nombre del producto
            </label>
            <input
              type="text"
              name="nombre"
              value={filters.nombre}
              onChange={handleFilterChange}
              placeholder="Ej: Coca Cola..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          {/* Marca */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Marca
            </label>
            <select
              name="marca"
              value={filters.marca}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option value="">Todas las marcas</option>
              {brands.map((brand) => (
                <option key={brand.brand_id} value={brand.brand_id}>
                  {brand.brand_name}
                </option>
              ))}
            </select>
          </div>

          {/* Región */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Región
            </label>
            <select
              name="region"
              value={filters.region}
              onChange={handleFilterChange}
              disabled={regions.length === 0}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition"
            >
              <option value="">
                {regions.length > 0 ? "Todas las regiones" : "Cargando..."}
              </option>
              {regions.map((region) => (
                <option key={region.region_id} value={region.region_id}>
                  {region.region_name}
                </option>
              ))}
            </select>
            {regions.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                No se pudieron cargar las regiones.
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
      )}

      {/* Tabla usando el componente DataTable */}
      <DataTable
        data={tableData}
        columns={tableColumns}
        loading={loading}
        emptyMessage="No se encontraron productos"
      />
    </div>
  );
};

export default GestionProductos;