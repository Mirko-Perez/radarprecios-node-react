import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../andes/AndesComercio.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const CapitalComercio = () => {
  const [storeName, setStoreName] = useState('');
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [similares, setSimilares] = useState([]);
  const navigate = useNavigate();
  const regionId = 2; // Capital

  useEffect(() => {
    fetch(`${API_URL}/stores/region/${regionId}`)
      .then(res => res.json())
      .then(data => setStores(data));
  }, []);

  const filteredStores = stores.filter(store =>
    store.store_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setSimilares([]);
    if (!storeName.trim()) return setError('El nombre es obligatorio');
    const res = await fetch(`${API_URL}/stores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ store_name: storeName, region_id: regionId }),
    });
    const data = await res.json();
    if (res.status === 201) {
      setStores([...stores, data]);
      setStoreName('');
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
      <h2>Comercios de Capital</h2>
      <form className="andes-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Nuevo comercio"
          value={storeName}
          onChange={e => setStoreName(e.target.value)}
        />
        <button type="submit">Agregar</button>
      </form>
      {error && <p className="error">{error}</p>}
      {similares.length > 0 && (
        <div className="similares">
          <strong>Similares encontrados:</strong>
          <ul>
            {similares.map(s => <li key={s.store_id}>{s.store_name}</li>)}
          </ul>
        </div>
      )}
      <input
        type="text"
        placeholder="Buscar comercio"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginTop: 20, width: '100%' }}
      />
      <ul className="andes-list">
        {filteredStores.map(store => (
          <li key={store.store_id}>{store.store_name}</li>
        ))}
      </ul>
    </div>
  );
};

export default CapitalComercio;
