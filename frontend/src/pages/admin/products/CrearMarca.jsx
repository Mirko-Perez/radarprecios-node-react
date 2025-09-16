import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';

const CrearMarca = ({ onCancel }) => {
    const [nombre, setNombre] = useState('');
    const [regionId, setRegionId] = useState('');
    const [storeId, setStoreId] = useState('');
    const [regiones, setRegiones] = useState([]);
    const [stores, setStores] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingStores, setLoadingStores] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // eliminado navigate, se usará onCancel
    const { user } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    // Cargar regiones al montar el componente
    useEffect(() => {
        const fetchRegiones = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/regions`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                // Handle new consistent response format
                const regionesData = response.data.success ? response.data.data : response.data;
                setRegiones(Array.isArray(regionesData) ? regionesData : []);
            } catch (error) {
                console.error('Error al cargar regiones:', error);
                setRegiones([]);
            } finally {
                setLoading(false);
            }
        };

        fetchRegiones();
    }, [API_URL]);

    // Cargar tiendas cuando se selecciona una región
    useEffect(() => {
        const fetchStores = async () => {
            if (!regionId) {
                setStores([]);
                setStoreId('');
                return;
            }

            setLoadingStores(true);
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/stores/region/${regionId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                // Handle new consistent response format
                const storesData = response.data.success ? response.data.data : response.data;
                setStores(Array.isArray(storesData) ? storesData : []);
            } catch (error) {
                console.error('Error al cargar tiendas:', error);
                setStores([]);
            } finally {
                setLoadingStores(false);
            }
        };

        fetchStores();
    }, [regionId, API_URL]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!nombre.trim() || !storeId) {
            setError('Por favor completa todos los campos');
            return;
        }

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/brands`,
                {
                    brand_name: nombre.trim(),
                    store_id: storeId
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            // Handle new consistent response format
            if (response.data.success) {
                setSuccess('Marca creada exitosamente');
                setNombre('');
                setStoreId('');
            } else {
                setError(response.data.message || 'Error al crear la marca');
            }
        } catch (error) {
            console.error('Error creating brand:', error);
            setError(error.response?.data?.message || 'Error al crear la marca');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="loading">Cargando datos iniciales...</div>;
    }

    return (
        <div className="form-container">
            <h2>Crear Nueva Marca</h2>

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSubmit} className="form">
                <div className="form-group">
                    <label htmlFor="region">Región:</label>
                    <select
                        id="region"
                        value={regionId}
                        onChange={(e) => setRegionId(e.target.value)}
                        className="form-control"
                        disabled={submitting}
                        required
                    >
                        <option value="">Selecciona una región</option>
                        {regiones.map(region => (
                            <option key={region.region_id} value={region.region_id}>
                                {region.region_name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="tienda">Tienda:</label>
                    <select
                        id="tienda"
                        value={storeId}
                        onChange={(e) => setStoreId(e.target.value)}
                        className="form-control"
                        disabled={!regionId || loadingStores || submitting}
                        required
                    >
                        <option value="">
                            {loadingStores ? 'Cargando tiendas...' : 'Selecciona una tienda'}
                        </option>
                        {stores.map(store => (
                            <option key={store.store_id} value={store.store_id}>
                                {store.store_name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="nombre">Nombre de la Marca:</label>
                    <input
                        type="text"
                        id="nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="form-control"
                        disabled={submitting}
                        required
                    />
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submitting || loadingStores}
                    >
                        {submitting ? 'Guardando...' : 'Guardar Marca'}
                    </button>

                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onCancel}
                        disabled={submitting}
                    >
                        Volver
                    </button>
                </div>
            </form>

            <style jsx>{`
                .form-container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background: #fff;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                
                .form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                
                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                label {
                    font-weight: 500;
                    color: #333;
                }
                
                .form-control {
                    padding: 10px 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 16px;
                }
                
                .form-control:focus {
                    border-color: #4a90e2;
                    outline: none;
                    box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
                }
                
                .form-actions {
                    display: flex;
                    gap: 12px;
                    margin-top: 20px;
                }
                
                .btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 4px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                
                .btn-primary {
                    background-color: #4a90e2;
                    color: white;
                }
                
                .btn-primary:hover:not(:disabled) {
                    background-color: #3a7bc8;
                }
                
                .btn-secondary {
                    background-color: #6c757d;
                    color: white;
                }
                
                .btn-secondary:hover:not(:disabled) {
                    background-color: #5a6268;
                }
                
                .alert {
                    padding: 12px;
                    border-radius: 4px;
                    margin-bottom: 20px;
                }
                
                .alert-danger {
                    background-color: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
                
                .alert-success {
                    background-color: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                
                .loading {
                    text-align: center;
                    padding: 20px;
                    font-size: 18px;
                    color: #666;
                }
            `}</style>
        </div>
    );
};

export default CrearMarca;
