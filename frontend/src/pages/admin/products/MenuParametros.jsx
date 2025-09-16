import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import axios from "axios";
import CrearComercio from "./CrearComercio";
import CrearMarca from "./CrearMarca";
import CrearProducto from "./CrearProducto";
import DataTable from "../../../components/forms/DataTable";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const MenuParametros = () => {
  const [view, setView] = useState(""); // '' | 'comercio' | 'marca' | 'producto'
  const [showTable, setShowTable] = useState(""); // '' | 'comercio' | 'marca' | 'producto'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Función para cargar datos según el tipo
  const fetchData = async (type) => {
    try {
      setLoading(true);
      let endpoint = "";
      switch (type) {
        case "comercio":
          endpoint = "/stores";
          break;
        case "marca":
          endpoint = "/brands";
          break;
        case "producto":
          endpoint = "/products";
          break;
        default:
          return;
      }
      
      const response = await axios.get(`${API_URL}${endpoint}`);
      // Handle new consistent response format
      const responseData = response.data.success ? response.data.data : response.data;
      setData(Array.isArray(responseData) ? responseData : []);
    } catch (error) {
      toast.error(`Error al cargar ${type}s`);
      console.error(`Error fetching ${type}s:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Efecto para cargar datos cuando se cambia la vista de tabla
  useEffect(() => {
    if (showTable) {
      fetchData(showTable);
    }
  }, [showTable]);

  const handleBack = () => {
    Swal.fire({
      title: "¿Cerrar el modal?",
      text: "Los cambios no guardados se perderán.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cerrar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#ef4444",
    }).then((result) => {
      if (result.isConfirmed) {
        setView("");
        setEditingItem(null);
      }
    });
  };

  const handleCloseTable = () => {
    setShowTable("");
    setData([]);
  };

  const handleEdit = (item, type) => {
    setEditingItem(item);
    setView(type);
    setShowTable("");
  };

  const handleDelete = async (item, type) => {
    try {
      const result = await Swal.fire({
        title: `¿Eliminar ${type}?`,
        text: "Esta acción no se puede deshacer.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
      });

      if (result.isConfirmed) {
        let endpoint = "";
        let idField = "";
        
        switch (type) {
          case "comercio":
            endpoint = `/stores/${item.store_id}`;
            idField = "store_id";
            break;
          case "marca":
            endpoint = `/brands/${item.brand_id}`;
            idField = "brand_id";
            break;
          case "producto":
            endpoint = `/products/${item.product_id}`;
            idField = "product_id";
            break;
        }

        await axios.delete(`${API_URL}${endpoint}`);
        
        // Actualizar la lista local
        setData(prevData => prevData.filter(d => d[idField] !== item[idField]));
        
        toast.success(`${type} eliminado correctamente`);
      }
    } catch (error) {
      toast.error(`Error al eliminar ${type}`);
      console.error(`Error deleting ${type}:`, error);
    }
  };

  const handleToggleStatus = async (item, type) => {
    try {
      let endpoint = "";
      let idField = "";
      let statusField = "is_active"; // Campo por defecto
      
      switch (type) {
        case "comercio":
          endpoint = `/stores/${item.store_id}/status`;
          idField = "store_id";
          break;
        case "marca":
          endpoint = `/brands/${item.brand_id}/status`;
          idField = "brand_id";
          statusField = "is_active";
          break;
        case "producto":
          endpoint = `/products/${item.product_id}/status`;
          idField = "product_id";
          statusField = "is_valid";
          break;
      }

      const newStatus = !item[statusField];
      await axios.put(`${API_URL}${endpoint}`, { [statusField]: newStatus });
      
      // Actualizar la lista local
      setData(prevData => 
        prevData.map(d => 
          d[idField] === item[idField] 
            ? { ...d, [statusField]: newStatus }
            : d
        )
      );
      
      toast.success(`${type} ${newStatus ? 'activado' : 'desactivado'} correctamente`);
    } catch (error) {
      toast.error(`Error al cambiar estado de ${type}`);
      console.error(`Error toggling ${type} status:`, error);
    }
  };

  // Configuraciones de columnas para cada tipo de dato
  const getColumnsConfig = (type) => {
    const baseActions = (item) => (
      <div className="flex gap-2">
        <button
          onClick={() => handleEdit(item, type)}
          className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition"
          title="Editar"
        >
          ✏️
        </button>

        
   {/* Botón activar/desactivar - solo para marca y producto */}
      {type !== "comercio" && (
        <button
          onClick={() => handleToggleStatus(item, type)}
          className={`px-2 py-1 text-white text-xs rounded transition ${
            (type === "producto" ? item.is_valid : item.is_active)
              ? "bg-orange-500 hover:bg-orange-600"
              : "bg-green-500 hover:bg-green-600"
          }`}
          title={`${
            (type === "producto" ? item.is_valid : item.is_active)
              ? "Desactivar"
              : "Activar"
          }`}
        >
          {(type === "producto" ? item.is_valid : item.is_active) ? "🔄" : "✅"}
        </button>
      )}

        <button
          onClick={() => handleDelete(item, type)}
          className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition"
          title="Eliminar"
        >
          🗑️
        </button>
      </div>
    );

    switch (type) {
      case "comercio":
        return [
          { key: 'store_name', title: 'Nombre' },
          { key: 'region_name', title: 'Region' ,  render: (value) => value || 'N/A' },
          { key: 'segmento', title: 'Segmento' },
          { key: 'ciudad', title: 'Ciudad' },
          { key: 'address', title: 'Dirección' },
        
          { 
            key: 'actions', 
            title: 'Acciones',
            render: (_, item) => baseActions(item)
          }
        ];

      case "marca":
        return [
          { key: 'brand_name', title: 'Nombre' },
          { key: 'description', title: 'Descripción' },
          { 
            key: 'is_active', 
            title: 'Estado',
            render: (isActive) => (
              <span className={`px-2 py-1 rounded text-white text-xs ${
                isActive ? "bg-green-500" : "bg-red-500"
              }`}>
                {isActive ? "Activa" : "Inactiva"}
              </span>
            )
          },
          { 
            key: 'actions', 
            title: 'Acciones',
            render: (_, item) => baseActions(item)
          }
        ];

      case "producto":
        return [
          {
            key: 'imagen',
            title: 'Imagen',
            width: '80px',
            render: (imagen, product) => (
              imagen ? (
                <img
                  src={`${API_URL}${imagen}`}
                  alt={product.product_name}
                  className="w-10 h-10 object-cover rounded"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/40";
                  }}
                />
              ) : (
                <div className="w-10 h-10 bg-gray-100 flex items-center justify-center text-gray-400 rounded">
                  📦
                </div>
              )
            )
          },
          { key: 'product_name', title: 'Producto' },
          { key: 'brand_name', title: 'Marca' },
          { key: 'group_name', title: 'Grupo', render: (value) => value || 'N/A' },
          { 
            key: 'is_valid', 
            title: 'Estado',
            render: (isValid) => (
              <span className={`px-2 py-1 rounded text-white text-xs ${
                isValid ? "bg-green-500" : "bg-red-500"
              }`}>
                {isValid ? "Activo" : "Inactivo"}
              </span>
            )
          },
          { 
            key: 'actions', 
            title: 'Acciones',
            render: (_, item) => baseActions(item)
          }
        ];

      default:
        return [];
    }
  };

  const renderModalContent = () => {
    const commonProps = {
      onCancel: handleBack,
      editData: editingItem,
      onSuccess: () => {
        setView("");
        setEditingItem(null);
        if (showTable) {
          fetchData(showTable);
        }
      }
    };

    if (view === "comercio") return <CrearComercio {...commonProps} />;
    if (view === "marca") return <CrearMarca {...commonProps} />;
    if (view === "producto") return <CrearProducto {...commonProps} />;
    return null;
  };

  const getTableTitle = (type) => {
    switch (type) {
      case "comercio": return "Gestión de Comercios";
      case "marca": return "Gestión de Marcas";
      case "producto": return "Gestión de Productos";
      default: return "";
    }
  };

  return (
    <div className="w-full max-w-full p-0 m-0 bg-transparent">
      {/* MENÚ PRINCIPAL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Crear Comercio */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            🏪 Comercios
          </h3>
          <div className="space-y-3">
            <button
              type="button"
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg shadow hover:from-blue-600 hover:to-blue-700 transition transform hover:-translate-y-0.5"
              onClick={() => setView("comercio")}
            >
              ➕ Crear Comercio
            </button>
            <button
              type="button"
              className="w-full px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-lg shadow hover:from-gray-600 hover:to-gray-700 transition transform hover:-translate-y-0.5"
              onClick={() => setShowTable("comercio")}
            >
              📋 Ver Comercios
            </button>
          </div>
        </div>

        {/* Crear Marca */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            🏷️ Marcas
          </h3>
          <div className="space-y-3">
            <button
              type="button"
              className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg shadow hover:from-green-600 hover:to-green-700 transition transform hover:-translate-y-0.5"
              onClick={() => setView("marca")}
            >
              ➕ Crear Marca
            </button>
            <button
              type="button"
              className="w-full px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-lg shadow hover:from-gray-600 hover:to-gray-700 transition transform hover:-translate-y-0.5"
              onClick={() => setShowTable("marca")}
            >
              📋 Ver Marcas
            </button>
          </div>
        </div>

        {/* Crear Producto */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            📦 Productos
          </h3>
          <div className="space-y-3">
            <button
              type="button"
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-lg shadow hover:from-purple-600 hover:to-purple-700 transition transform hover:-translate-y-0.5"
              onClick={() => setView("producto")}
            >
              ➕ Crear Producto
            </button>
            <button
              type="button"
              className="w-full px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-lg shadow hover:from-gray-600 hover:to-gray-700 transition transform hover:-translate-y-0.5"
              onClick={() => setShowTable("producto")}
            >
              📋 Ver Productos
            </button>
          </div>
        </div>
      </div>

      {/* MODAL CREAR/EDITAR */}
      {view && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 relative transform transition-transform duration-300 scale-100 opacity-100">
            {/* BOTÓN CERRAR */}
            <button
              className="absolute top-4 right-4 text-gray-700 hover:text-white bg-gray-200 hover:bg-red-500 rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition transform hover:scale-110 z-10"
              onClick={handleBack}
              aria-label="Cerrar modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {renderModalContent()}
          </div>
        </div>
      )}

      {/* MODAL TABLA */}
      {showTable && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto p-6 relative transform transition-transform duration-300 scale-100 opacity-100">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
              <h2 className="text-2xl font-bold text-gray-800">
                {getTableTitle(showTable)}
              </h2>
              <button
                className="text-gray-700 hover:text-white bg-gray-200 hover:bg-red-500 rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition transform hover:scale-110"
                onClick={handleCloseTable}
                aria-label="Cerrar tabla"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* BOTÓN CREAR NUEVO */}
            <div className="mb-6">
              <button
                onClick={() => {
                  setView(showTable);
                  setEditingItem(null);
                }}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg shadow hover:from-blue-600 hover:to-blue-700 transition"
              >
                ➕ Crear {showTable === 'comercio' ? 'Comercio' : showTable === 'marca' ? 'Marca' : 'Producto'}
              </button>
            </div>

            {/* TABLA */}
            <DataTable
              data={data.map(item => ({ ...item, id: item.store_id || item.brand_id || item.product_id }))}
              columns={getColumnsConfig(showTable)}
              loading={loading}
              emptyMessage={`No hay ${showTable}s registrados`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuParametros;