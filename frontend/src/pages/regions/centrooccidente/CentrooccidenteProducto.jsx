// CentrooccidenteProducto con regionId=4
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../andes/AndesComercio.css';
import Select from 'react-select';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const CentrooccidenteProducto = () => {
  const [groups, setGroups] = useState([]);
  const [brands, setBrands] = useState([]);
  const [groupId, setGroupId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [productName, setProductName] = useState('');
  const [imagen, setImagen] = useState(null);
  const [error, setError] = useState('');
  const [similares, setSimilares] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProductImage, setSelectedProductImage] = useState(null);
  const navigate = useNavigate();
  const regionId = 4; // Centrooccidente

  useEffect(() => {
    fetch(`${API_URL}/groups`).then(res => res.json()).then(data => setGroups(Array.isArray(data) ? data : []));
    fetch(`${API_URL}/brands`).then(res => res.json()).then(data => setBrands(Array.isArray(data) ? data : []));
    fetch(`${API_URL}/products/region/${regionId}`).then(res => res.json()).then(data => setProducts(Array.isArray(data) ? data : []));
  }, []);

  const filteredProductsByGroup = products.filter(product => String(product.group_id) === String(groupId));
  const filteredProducts = products.filter(product => product.product_name.toLowerCase().includes(search.toLowerCase()));

  const handleSelectProduct = (e) => {
    const prodId = e.target.value;
    setSelectedProductId(prodId);
    if (prodId && prodId !== 'nuevo') {
      const prod = filteredProductsByGroup.find(p => String(p.product_id) === String(prodId));
      setProductName(prod ? prod.product_name : '');
      setSelectedProductImage(prod && prod.imagen ? prod.imagen : null);
      setImagen(null);
    } else {
      setProductName('');
      setSelectedProductImage(null);
      setImagen(null);
    }
  };

  useEffect(() => {
    setSelectedProductId('');
    setProductName('');
    setImagen(null);
    setBrandId('');
  }, [groupId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setSimilares([]);
    if (!groupId) return setError('El grupo es obligatorio');
    if (!brandId) return setError('La marca es obligatoria');
    if (!selectedProductId && !productName.trim()) return setError('El nombre es obligatorio');
    const formData = new FormData();
    formData.append('brand_id', brandId);
    formData.append('group_id', groupId);
    formData.append('region_id', regionId);

    if (selectedProductId && selectedProductId !== 'nuevo') {
      formData.append('product_id', selectedProductId);
      formData.append('product_name', productName);
    } else {
      formData.append('product_name', productName);
    }
    if (imagen) formData.append('imagen', imagen);

    const res = await fetch(`${API_URL}/products`, { method: 'POST', body: formData });
    const data = await res.json();
    if (res.status === 201) {
      setProducts([...products, data]);
      setProductName('');
      setBrandId('');
      setGroupId('');
      setImagen(null);
      setSelectedProductId('');
    } else if (res.status === 409) {
      setError(data.message);
      setSimilares(data.similares || []);
    } else {
      setError(data.message || 'Error al agregar');
    }
  };

  return (
    <div className="andes-container">
      <button className="andes-btn back-btn" style={{ marginBottom: 20 }} onClick={() => navigate(-1)}>
        Volver atrás
      </button>
      <h2>Productos de Centrooccidente</h2>
      <form className="andes-form" onSubmit={handleAdd} encType="multipart/form-data">
        <select value={groupId} onChange={e => setGroupId(e.target.value)}>
          <option value="">Selecciona grupo</option>
          {groups.map(g => <option key={g.group_id} value={g.group_id}>{g.group_name}</option>)}
        </select>
        <Select
          options={brands.map(b => ({ value: b.brand_id, label: b.brand_name }))}
          value={brands.filter(b => String(b.brand_id) === String(brandId)).map(b => ({ value: b.brand_id, label: b.brand_name }))}
          onChange={option => setBrandId(option ? option.value : '')}
          placeholder="Selecciona marca..."
          isClearable
          styles={{ container: base => ({ ...base, width: '100%' }) }}
        />
        {groupId && (
          <>
            <select value={selectedProductId} onChange={handleSelectProduct}>
              <option value="">Selecciona producto</option>
              <option value="nuevo">-- Nuevo producto --</option>
              {filteredProductsByGroup.map(p => <option key={p.product_id} value={p.product_id}>{p.product_name}</option>)}
            </select>
            {(selectedProductId === 'nuevo' || selectedProductId === '') && (
              <input type="text" placeholder="Nombre de producto" value={productName} onChange={e => setProductName(e.target.value)} />
            )}
            {selectedProductImage && (
              <img
                src={selectedProductImage.startsWith('/api/images/')
                  ? selectedProductImage
                  : selectedProductImage.startsWith('/images/')
                    ? `/api${selectedProductImage}`
                    : `/api/images/${selectedProductImage.replace(/^.*[\\/]/, '')}`}
                alt="producto"
                style={{ maxWidth: 100, marginBottom: 10 }}
              />
            )}
            {selectedProductId && selectedProductId !== '' && (
              <>
                <input type="file" accept="image/*" onChange={e => setImagen(e.target.files[0])} />
              </>
            )}
          </>
        )}
        {error && <p className="error">{error}</p>}
        {similares.length > 0 && (
          <div className="similares">
            <strong>Similares encontrados:</strong>
            <ul>
              {similares.map(s => <li key={s.product_id}>{s.product_name}</li>)}
            </ul>
          </div>
        )}
        <button type="submit">Guardar</button>
        <input type="text" placeholder="Buscar producto" value={search} onChange={e => setSearch(e.target.value)} style={{ marginTop: 20 }} />
        <ul className="andes-list">
          {filteredProducts.map(product => {
            const brand = brands.find(b => String(b.brand_id) === String(product.brand_id));
            return (
              <li key={product.product_id}>
                {product.imagen && (
                  <img
                    src={product.imagen.startsWith('/api/images/')
                      ? product.imagen
                      : product.imagen.startsWith('/images/')
                        ? `/api${product.imagen}`
                        : `/api/images/${product.imagen.replace(/^.*[\\/]/, '')}`}
                    alt={product.product_name}
                    style={{ maxWidth: 90, maxHeight: 90, marginRight: 10, borderRadius: 8 }}
                  />
                )}
                <span style={{ fontWeight: 600 }}>{product.product_name}</span>
                {brand && (
                  <span style={{ marginLeft: 8, color: '#555', fontSize: '0.95em' }}>({brand.brand_name})</span>
                )}
              </li>
            );
          })}
        </ul>
      </form>
    </div>
  );
};

export default CentrooccidenteProducto;
