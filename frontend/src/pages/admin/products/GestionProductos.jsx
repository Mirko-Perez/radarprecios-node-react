import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../shared/AdminForms.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const GestionProductos = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    nombre: '',
    marca: '',
    region: ''
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [brands, setBrands] = useState([]);
  const [regions, setRegions] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Verificar permisos
  useEffect(() => {
    if (user?.permissionId > 2) {
      navigate('/unauthorized');
    }
  }, [user, navigate]);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Intentar cargar productos, marcas y regiones en paralelo
        const [productsRes, brandsRes, regionsRes] = await Promise.allSettled([
          axios.get(`${API_URL}/products`),
          axios.get(`${API_URL}/brands`),
          axios.get(`${API_URL}/regions`).catch(() => ({ data: [] }))
        ]);

        // Manejar la respuesta de productos
        if (productsRes.status === 'fulfilled') {
          setProducts(productsRes.value.data);
          setFilteredProducts(productsRes.value.data);
        } else {
          throw new Error('Error al cargar los productos');
        }

        // Manejar la respuesta de marcas
        if (brandsRes.status === 'fulfilled') {
          setBrands(brandsRes.value.data);
        }

        // Manejar la respuesta de regiones
        if (regionsRes.status === 'fulfilled') {
          setRegions(regionsRes.value.data || []);
        }
      } catch (err) {
        setError('Error al cargar los datos. Por favor, intente de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtrar productos
  useEffect(() => {
    let result = [...products];

    if (filters.nombre) {
      result = result.filter(p =>
        p.product_name.toLowerCase().includes(filters.nombre.toLowerCase())
      );
    }

    if (filters.marca) {
      result = result.filter(p =>
        p.brand_id.toString() === filters.marca
      );
    }

    if (filters.region) {
      result = result.filter(p =>
        p.region_id.toString() === filters.region
      );
    }

    setFilteredProducts(result);
  }, [filters, products]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStatusChange = (product) => {
    setSelectedProduct(product);
    setShowConfirm(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedProduct) return;

    try {
      const newStatus = !selectedProduct.is_valid;



      const response = await axios.put(
        `${API_URL}/products/${selectedProduct.product_id}/status`,
        { is_valid: newStatus },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          validateStatus: (status) => status < 500, // No lanzar error para códigos 4xx
        }
      );

      if (response.status === 200) {
        // Actualizar estado local
        setProducts(products.map(p =>
          p.product_id === selectedProduct.product_id
            ? { ...p, is_valid: newStatus }
            : p
        ));

        setShowConfirm(false);
        setSelectedProduct(null);

        // Mostrar notificación de éxito
        toast.success(`Producto ${newStatus ? 'habilitado' : 'deshabilitado'} correctamente`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        // Manejar errores de la API
        const errorMessage = response.data?.message || 'Error desconocido';
        throw new Error(`Error del servidor: ${errorMessage}`);
      }
    } catch (err) {


      let errorMessage = 'Error al actualizar el estado del producto';
      if (err.response) {
        // El servidor respondió con un código de estado fuera del rango 2xx
        errorMessage = err.response.data?.message || errorMessage;
      } else if (err.request) {
        // La solicitud fue hecha pero no se recibió respuesta
        errorMessage = 'No se recibió respuesta del servidor. Verifica tu conexión.';
      }

      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const getBrandName = (brandId) => {
    const brand = brands.find(b => b.brand_id === brandId);
    return brand ? brand.brand_name : 'N/A';
  };

  const getRegionName = (regionId) => {
    const region = regions.find(r => r.region_id === regionId);
    return region ? region.region_name : 'N/A';
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Filtros</h5>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Nombre del producto</label>
              <input
                type="text"
                className="form-control"
                name="nombre"
                value={filters.nombre}
                onChange={handleFilterChange}
                placeholder="Buscar por nombre..."
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Marca</label>
              <select
                className="form-select"
                name="marca"
                value={filters.marca}
                onChange={handleFilterChange}
              >
                <option value="">Todas las marcas</option>
                {brands.map(brand => (
                  <option key={brand.brand_id} value={brand.brand_id}>
                    {brand.brand_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Región</label>
              <select
                className="form-select"
                name="region"
                value={filters.region}
                onChange={handleFilterChange}
                disabled={regions.length === 0}
              >
                <option value="">
                  {regions.length > 0 ? 'Todas las regiones' : 'Cargando regiones...'}
                </option>
                {regions.map(region => (
                  <option key={region.region_id} value={region.region_id}>
                    {region.region_name}
                  </option>
                ))}
              </select>
              {regions.length === 0 && (
                <small className="text-muted">
                  No se pudieron cargar las regiones. Los filtros por región no están disponibles.
                </small>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Tabla de productos */}
      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Nombre</th>
              <th>Marca</th>
              <th>Región</th>
              <th>Grupo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.filter((item)=>item.deleted ===false).map(product => (
                <tr key={product.product_id}>
                  <td>
                    {product.imagen ? (
                      <img
                        src={`${API_URL}${product.imagen}`}
                        alt={product.product_name}
                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/50';
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '50px',
                        height: '50px',
                        backgroundColor: '#f8f9fa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#6c757d'
                      }}>
                        <i className="bi bi-image"></i>
                      </div>
                    )}
                  </td>
                  <td>{product.product_name}</td>
                  <td>{getBrandName(product.brand_id)}</td>
                  <td>{getRegionName(product.region_id)}</td>
                  <td>{product.group_name || 'N/A'}</td>
                  <td>
                    <span className={`badge ${product.is_valid ? 'bg-success' : 'bg-danger'}`}>
                      {product.is_valid ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`btn btn-sm ${product.is_valid ? 'btn-danger' : 'btn-success'}`}
                      onClick={() => handleStatusChange(product)}
                    >
                      {product.is_valid ? 'Deshabilitar' : 'Habilitar'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center">
                  No se encontraron productos que coincidan con los filtros
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de confirmación */}
      {showConfirm && selectedProduct && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmar acción</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowConfirm(false);
                    setSelectedProduct(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                ¿Está seguro que desea {selectedProduct.is_valid ? 'deshabilitar' : 'habilitar'} el producto "{selectedProduct.product_name}"?
                {!selectedProduct.is_valid && (
                  <div className="alert alert-warning mt-2">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    Al habilitar este producto, también se habilitarán sus precios asociados.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowConfirm(false);
                    setSelectedProduct(null);
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={`btn ${selectedProduct.is_valid ? 'btn-danger' : 'btn-success'}`}
                  onClick={confirmStatusChange}
                >
                  {selectedProduct.is_valid ? 'Deshabilitar' : 'Habilitar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionProductos;
