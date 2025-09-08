import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../andes/AndesComercio.css';
import Select from 'react-select';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const CapitalPrecio = () => {
  const [brands, setBrands] = useState([]);
  const [brandId, setBrandId] = useState('');
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState('');
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState('');
  const [price, setPrice] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const regionId = 2; // Capital

  useEffect(() => {
    fetch(`${API_URL}/brands`).then(res => res.json()).then(data => setBrands(Array.isArray(data) ? data : []));
    fetch(`${API_URL}/stores/region/${regionId}`).then(res => res.json()).then(data => setStores(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => {
    setProductId('');
    setProducts([]);
    if (brandId) {
      fetch(`${API_URL}/prices/products/${brandId}/${regionId}`).then(res => res.json()).then(data => setProducts(Array.isArray(data) ? data : []));
    }
  }, [brandId]);

  const filteredProducts = products.filter(product => product.product_name.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!brandId || !productId || !storeId || !price) {
      setError('Todos los campos son obligatorios');
      return;
    }
    const res = await fetch(`${API_URL}/prices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, store_id: storeId, price_amount: price })
    });
    const data = await res.json();
    if (res.status === 201) {
      setSuccess('Precio guardado correctamente');
      setPrice('');
      setProductId('');
      setStoreId('');
    } else {
      setError(data.message || 'Error al guardar');
    }
  };

  return (
    <div className="andes-container">
      <button className="andes-btn back-btn" style={{ marginBottom: 20 }} onClick={() => navigate(-1)}>
        Volver atrás
      </button>
      <h2>Añadir Precio - Capital</h2>
      <form className="andes-form" onSubmit={handleSubmit}>
        <Select options={brands.map(b => ({ value: b.brand_id, label: b.brand_name }))} value={brands.filter(b => String(b.brand_id) === String(brandId)).map(b => ({ value: b.brand_id, label: b.brand_name }))} onChange={o => setBrandId(o ? o.value : '')} placeholder="Selecciona marca..." isClearable styles={{ container: base => ({ ...base, width: '100%', marginBottom: 10 }) }} />
        {brandId && (
          <>
            <input type="text" placeholder="Buscar producto" value={search} onChange={e => setSearch(e.target.value)} />
            <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 10 }}>
              {filteredProducts.map(product => (
                <div
                  key={product.product_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 8,
                    background: productId === String(product.product_id) ? '#e3f2fd' : '#fff',
                    borderRadius: 6,
                    padding: 6,
                    cursor: 'pointer'
                  }}
                  onClick={() => setProductId(String(product.product_id))}
                >
                  {product.imagen && (
                    <img
                      src={product.imagen.startsWith('/api/images/')
                        ? product.imagen
                        : product.imagen.startsWith('/images/')
                          ? `/api${product.imagen}`
                          : `/api/images/${product.imagen.replace(/^.*[\\/]/, '')}`}
                      alt={product.product_name}
                      style={{ maxWidth: 60, maxHeight: 60, borderRadius: 8 }}
                    />
                  )}
                  <span style={{ fontWeight: 600 }}>{product.product_name}</span>
                </div>
              ))}
            </div>
          </>
        )}
        <select value={storeId} onChange={e => setStoreId(e.target.value)}>
          <option value="">Selecciona comercio</option>
          {stores.map(s => <option key={s.store_id} value={s.store_id}>{s.store_name}</option>)}
        </select>
        <input type="number" step="0.01" placeholder="Precio" value={price} onChange={e => setPrice(e.target.value)} />
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <button type="submit">Guardar</button>
      </form>
    </div>
  );
};

export default CapitalPrecio;
