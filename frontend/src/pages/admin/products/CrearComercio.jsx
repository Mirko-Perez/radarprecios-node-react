import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import '../../dashboard/Menu.css';

const CrearComercio = ({ onCancel }) => {
    const [nombre, setNombre] = useState('');
    const [regionId, setRegionId] = useState('');
    const [regiones, setRegiones] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // eliminado navigate, se usará onCancel
    const { user } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    useEffect(() => {
        const fetchRegiones = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/regions`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setRegiones(response.data || []);
            } catch (err) {
                console.error('Error fetching regions:', err);
                setError('Error al cargar las regiones');
            } finally {
                setLoading(false);
            }
        };

        fetchRegiones();
    }, [API_URL]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!nombre.trim() || !regionId) {
            setError('Por favor completa todos los campos');
            return;
        }

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_URL}/stores`,
                {
                    store_name: nombre.trim(),
                    region_id: regionId
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            setSuccess('Comercio creado exitosamente');
            setNombre('');
            setRegionId('');
        } catch (err) {
            console.error('Error creating store:', err);
            setError(err.response?.data?.message || 'Error al crear el comercio');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="loading">Cargando regiones...</div>;
    }

    return (
        <div className="form-container">
            <h2>Crear Nuevo Comercio</h2>

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
                    <label htmlFor="nombre">Nombre del Comercio:</label>
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
                        disabled={submitting}
                    >
                        {submitting ? 'Guardando...' : 'Guardar Comercio'}
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
            `}</style>
        </div>
    );
};

export default CrearComercio;
