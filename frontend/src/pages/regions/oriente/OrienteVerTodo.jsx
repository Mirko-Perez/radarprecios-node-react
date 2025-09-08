import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../andes/AndesComercio.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const OrienteVerTodo = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const regionId = 6; // Oriente

  useEffect(() => {
    fetch(`${API_URL}/overview/${regionId}`)
      .then(res => res.json())
      .then(responseData => {
        // Check if response is an array or has a data property
        const rows = Array.isArray(responseData) ? responseData : 
                   (responseData && Array.isArray(responseData.data)) ? responseData.data : [];
        setData(rows);
      })
      .catch(() => {
        setData([]);
      });
  }, [regionId]);

  // Agrupar comercios
  const stores = [];
  const storeMap = {};
  data.forEach(row => {
    if (!storeMap[row.store_id]) {
      storeMap[row.store_id] = { store_id: row.store_id, store_name: row.store_name };
      stores.push(storeMap[row.store_id]);
    }
  });

  // Agrupar por grupo > producto (nombre) > marca
  const groups = {};
  data.forEach(row => {
    if (!groups[row.group_id]) groups[row.group_id] = { name: row.group_name, products: {} };
    const group = groups[row.group_id];
    if (!group.products[row.product_name]) group.products[row.product_name] = { imagen: row.imagen, brands: {} };
    const product = group.products[row.product_name];
    if (!product.brands[row.brand_id]) product.brands[row.brand_id] = { brand: row.brand_name, prices: {} };
    product.brands[row.brand_id].prices[row.store_id] = row.price_amount;
  });

  // Filtro por nombre de producto
  const filterProduct = (name) => name.toLowerCase().includes(search.toLowerCase());

  return (
    <div className="andes-container andes-table-container">
      <button className="andes-btn back-btn" style={{ marginBottom: 20 }} onClick={() => navigate(-1)}>
        Volver atrás
      </button>
      <h2>Comparativo de precios Oriente</h2>
      <input
        type="text"
        placeholder="Buscar producto"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="andes-search"
      />
      <table className="andes-table">
        <thead>
          <tr>
            <th className="andes-th andes-th-product">Producto</th>
            {stores.map(store => (
              <th key={store.store_id} className="andes-th andes-th-store">{store.store_name}</th>
            ))}
            <th className="andes-th andes-th-min">Min</th>
            <th className="andes-th andes-th-max">Max</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(groups).map(([groupId, group]) => (
            <React.Fragment key={groupId}>
              {/* Grupo como separador */}
              <tr className="andes-group-row">
                <td colSpan={1 + stores.length + 2} className="andes-td-group">{group.name}</td>
              </tr>
              {/* Productos */}
              {Object.entries(group.products)
                .filter(([productName]) => filterProduct(productName))
                .map(([productName, product]) => {
                  return (
                    <React.Fragment key={productName}>
                      {/* Fila de producto (ancho completo) */}
                      <tr className="andes-product-row">
                        <td colSpan={1 + stores.length + 2} className="andes-td-product-header">
                          {product.imagen && (
                            <img
                              src={product.imagen.startsWith('/api/images/')
                                ? product.imagen
                                : product.imagen.startsWith('/images/')
                                  ? `/api${product.imagen}`
                                  : `/api/images/${product.imagen.replace(/^.*[\\/]/, '')}`}
                              alt={productName}
                              className="andes-product-img"
                            />
                          )}
                          <span className="andes-product-name">{productName}</span>
                        </td>
                      </tr>
                      {/* Fila(s) de marcas */}
                      {Object.entries(product.brands).map(([brandId, brandObj]) => {
                        const precios = Object.values(brandObj.prices).filter(p => p !== undefined && p !== null);
                        const min = precios.length ? Math.min(...precios) : null;
                        const max = precios.length ? Math.max(...precios) : null;
                        return (
                          <tr key={brandId}>
                            <td className="andes-td-brand">{brandObj.brand}</td>
                            {stores.map(store => (
                              <td key={store.store_id} className={
                                brandObj.prices[store.store_id] ? 'andes-td-price' : 'andes-td-empty'
                              }>
                                {brandObj.prices[store.store_id] !== undefined && brandObj.prices[store.store_id] !== null
                                  ? Number(brandObj.prices[store.store_id]).toLocaleString('es-VE', { minimumFractionDigits: 2 })
                                  : '-'}
                              </td>
                            ))}
                            <td className="andes-td-min">
                              {min !== null ? Number(min).toLocaleString('es-VE', { minimumFractionDigits: 2 }) : '-'}
                            </td>
                            <td className="andes-td-max">
                              {max !== null ? Number(max).toLocaleString('es-VE', { minimumFractionDigits: 2 }) : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrienteVerTodo;