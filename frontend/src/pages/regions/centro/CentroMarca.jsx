import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../andes/AndesComercio.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const CentroMarca = () => {
  const [brandName, setBrandName] = useState('');
  const [brands, setBrands] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [similares, setSimilares] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/brands`).then(res => res.json()).then(data => setBrands(Array.isArray(data) ? data : []));
  }, []);

  const filteredBrands = brands.filter(b => b.brand_name.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setSimilares([]);
    if (!brandName.trim()) return setError('El nombre es obligatorio');
    const res = await fetch(`${API_URL}/brands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand_name: brandName })
    });
    const data = await res.json();
    if (res.status === 201) {
      setBrands([...brands, data]);
      setBrandName('');
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
      <h2>Marcas de Centro</h2>
      <form className="andes-form" onSubmit={handleAdd}>
        <input type="text" placeholder="Nueva marca" value={brandName} onChange={e => setBrandName(e.target.value)} />
        <button type="submit">Agregar</button>
      </form>
      {error && <p className="error">{error}</p>}
      {similares.length > 0 && (
        <div className="similares">
          <strong>Similares encontrados:</strong>
          <ul>
            {similares.map(s => <li key={s.brand_id}>{s.brand_name}</li>)}
          </ul>
        </div>
      )}
      <input type="text" placeholder="Buscar marca" value={search} onChange={e => setSearch(e.target.value)} style={{ marginTop: 20, width: '100%' }} />
      <ul className="andes-list">
        {filteredBrands.map(b => <li key={b.brand_id}>{b.brand_name}</li>)}
      </ul>
    </div>
  );
};

export default CentroMarca;
