import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { FaCheck, FaUndo } from 'react-icons/fa';
import '../../dashboard/Menu.css';

const ObservationsList = () => {
    const [observations, setObservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingId, setUpdatingId] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    const updateObservationStatus = async (id, isActive) => {
        try {
            setUpdatingId(id);
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No se encontró el token de autenticación');
                return;
            }

            const response = await axios.put(
                `${API_URL}/observations/${id}/status`,
                { is_active: isActive },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Actualizar el estado local
            setObservations(prevObservations =>
                prevObservations.map(obs =>
                    obs.observation_id === id
                        ? { ...obs, is_active: isActive }
                        : obs
                )
            );

        } catch (err) {
            console.error('Error updating observation status:', err);
            setError('Error al actualizar el estado de la observación');
        } finally {
            setUpdatingId(null);
        }
    };

    useEffect(() => {
        const fetchObservations = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    const errorMsg = 'No se encontró el token de autenticación';
                    console.error(errorMsg);
                    setError(errorMsg);
                    setLoading(false);
                    return;
                }


                const response = await axios.get(`${API_URL}/observations`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000 // 10 seconds timeout
                });

                // Handle the response based on its structure
                const responseData = response.data;
                if (responseData && responseData.success !== undefined) {
                    if (Array.isArray(responseData.data)) {
                        setObservations(responseData.data);
                    } else {
                        const errorMsg = 'El formato de la respuesta del servidor es inválido';
                        console.error(errorMsg, responseData);
                        setError(errorMsg);
                    }
                } else if (Array.isArray(responseData)) {
                    // Fallback in case the backend changes its response format
                    setObservations(responseData);
                } else {
                    const errorMsg = 'Formato de respuesta inesperado del servidor';
                    console.error(errorMsg, responseData);
                    setError(errorMsg);
                }
            } catch (err) {
                console.error('Error fetching observations:', err);

                let errorMessage = 'Error al cargar las observaciones. Inténtalo de nuevo más tarde.';

                if (err.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    console.error('Response data:', err.response.data);
                    console.error('Response status:', err.response.status);
                    console.error('Response headers:', err.response.headers);

                    if (err.response.status === 401) {
                        errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente.';
                        navigate('/login');
                    } else if (err.response.status === 400) {
                        errorMessage = 'Error en la solicitud: ' +
                            (err.response.data?.message || 'Datos inválidos');
                    } else if (err.response.data?.message) {
                        errorMessage = `Error del servidor: ${err.response.data.message}`;
                    }
                } else if (err.request) {
                    // The request was made but no response was received
                    console.error('No se recibió respuesta del servidor:', err.request);
                    errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
                } else {
                    // Something happened in setting up the request that triggered an Error
                    console.error('Error al configurar la solicitud:', err.message);
                    errorMessage = `Error: ${err.message}`;
                }

                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchObservations();
    }, [navigate]);

    if (loading) {
        return <div className="loading">Cargando observaciones...</div>;
    }

    const tableStyle = {
        width: '100%',
        tableLayout: 'fixed',
        borderCollapse: 'collapse',
        marginTop: '20px',
        fontSize: '14px'
    };

    const thStyle = {
        backgroundColor: '#f1f3f5',
        padding: '12px',
        textAlign: 'left',
        borderBottom: '2px solid #dee2e6',
        fontWeight: '600',
        color: '#495057'
    };

    const tdStyle = {
        padding: '12px',
        borderBottom: '1px solid #e9ecef',
        wordWrap: 'break-word',
        verticalAlign: 'middle'
    };

    const actionButtonStyle = {
        padding: '6px 12px',
        borderRadius: '4px',
        border: 'none',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '13px',
        transition: 'all 0.2s',
        marginRight: '8px'
    };

    const completeButtonStyle = {
        ...actionButtonStyle,
        backgroundColor: '#28a745',
        color: 'white',
        '&:hover': {
            backgroundColor: '#218838',
            transform: 'translateY(-1px)'
        }
    };

    const undoButtonStyle = {
        ...actionButtonStyle,
        backgroundColor: '#6c757d',
        color: 'white',
        '&:hover': {
            backgroundColor: '#5a6268',
            transform: 'translateY(-1px)'
        }
    };

    const containerStyle = {
        width: '95%',
        margin: '0 auto',
        overflowX: 'auto',
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    };

    return (
        <div className="container mt-4" style={containerStyle}>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="table-responsive">
                {observations && observations.length > 0 ? (
                    <table className="table table-striped" style={tableStyle}>
                        <colgroup>
                            <col style={{ width: '5%' }} />
                            <col style={{ width: '35%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '20%' }} />
                            <col style={{ width: '15%' }} />
                            <col style={{ width: '15%' }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th style={thStyle}>ID</th>
                                <th style={thStyle}>Observación</th>
                                <th style={thStyle}>Usuario ID</th>
                                <th style={thStyle}>Fecha</th>
                                <th style={thStyle}>Estado</th>
                                <th style={thStyle}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {observations.map(obs => (
                                <tr key={obs.observation_id}>
                                    <td style={tdStyle}>{obs.observation_id}</td>
                                    <td style={tdStyle}>{obs.observation_string}</td>
                                    <td style={tdStyle}>{obs.user_id}</td>
                                    <td style={tdStyle}>
                                        {new Date(obs.created_at).toLocaleString('es-CL', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                    <td style={tdStyle}>
                                        <span style={{
                                            padding: '6px 12px',
                                            borderRadius: '20px',
                                            backgroundColor: obs.is_active ? '#d4edda' : '#f8d7da',
                                            color: obs.is_active ? '#155724' : '#721c24',
                                            fontWeight: '500',
                                            display: 'inline-block',
                                            minWidth: '80px',
                                            textAlign: 'center'
                                        }}>
                                            {obs.is_active ? 'Pendiente' : 'Realizado'}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>
                                        {obs.is_active ? (
                                            <button
                                                onClick={() => updateObservationStatus(obs.observation_id, false)}
                                                disabled={updatingId === obs.observation_id}
                                                style={{
                                                    ...completeButtonStyle,
                                                    opacity: updatingId === obs.observation_id ? 0.7 : 1,
                                                    cursor: updatingId === obs.observation_id ? 'not-allowed' : 'pointer'
                                                }}
                                                title="Marcar como realizado"
                                            >
                                                <FaCheck /> {updatingId === obs.observation_id ? 'Procesando...' : 'Marcar'}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => updateObservationStatus(obs.observation_id, true)}
                                                disabled={updatingId === obs.observation_id}
                                                style={{
                                                    ...undoButtonStyle,
                                                    opacity: updatingId === obs.observation_id ? 0.7 : 1,
                                                    cursor: updatingId === obs.observation_id ? 'not-allowed' : 'pointer'
                                                }}
                                                title="Marcar como pendiente"
                                            >
                                                <FaUndo /> {updatingId === obs.observation_id ? 'Procesando...' : 'Deshacer'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="alert alert-info">No hay observaciones registradas</div>
                )}
            </div>
        </div>
    );
};

export default ObservationsList;
