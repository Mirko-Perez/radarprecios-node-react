import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { FaCheck, FaUndo, FaUser, FaMapMarkerAlt, FaClock } from 'react-icons/fa';

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

                // Use the new endpoint with detailed information
                const response = await axios.get(`${API_URL}/observations/details`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
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
                    console.error('No se recibió respuesta del servidor:', err.request);
                    errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
                } else {
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
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg text-gray-600">Cargando observaciones...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-900">Lista de Observaciones</h1>
                    <p className="text-gray-600 mt-1">Gestiona las observaciones realizadas por los usuarios</p>
                </div>

                {error && (
                    <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="text-red-800">{error}</div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    {observations && observations.length > 0 ? (
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        <span className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            ID
                                        </span>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Observación
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        <span className="flex items-center gap-2">
                                            <FaUser className="text-green-500" />
                                            Usuario
                                        </span>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        <span className="flex items-center gap-2">
                                            <FaMapMarkerAlt className="text-purple-500" />
                                            Ubicación
                                        </span>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        <span className="flex items-center gap-2">
                                            <FaClock className="text-orange-500" />
                                            Fecha
                                        </span>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {observations.map(obs => (
                                    <tr key={obs.observation_id} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            #{obs.observation_id}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 max-w-md">
                                            <div className="line-clamp-3">
                                                {obs.observation_string}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900">
                                                    {obs.username || 'Usuario desconocido'}
                                                </span>
                                                {obs.first_name && obs.last_name && (
                                                    <span className="text-gray-500 text-xs">
                                                        {obs.first_name} {obs.last_name}
                                                    </span>
                                                )}
                                                {obs.email && (
                                                    <span className="text-gray-500 text-xs">
                                                        {obs.email}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            <div className="flex flex-col">
                                                {obs.store_name ? (
                                                    <>
                                                        <span className="font-medium text-gray-900">
                                                            {obs.store_name}
                                                        </span>
                                                        <span className="text-gray-500 text-xs">
                                                            {obs.region_name}
                                                        </span>
                                                        {obs.store_address && (
                                                            <span className="text-gray-500 text-xs">
                                                                {obs.store_address}
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-gray-400 italic">
                                                        Sin ubicación
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {new Date(obs.created_at).toLocaleDateString('es-CL', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                                <span className="text-gray-500 text-xs">
                                                    {new Date(obs.created_at).toLocaleTimeString('es-CL', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                obs.is_active 
                                                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                                                    : 'bg-green-100 text-green-800 border border-green-200'
                                            }`}>
                                                {obs.is_active ? 'Pendiente' : 'Realizado'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {obs.is_active ? (
                                                <button
                                                    onClick={() => updateObservationStatus(obs.observation_id, false)}
                                                    disabled={updatingId === obs.observation_id}
                                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                                        updatingId === obs.observation_id
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md'
                                                    }`}
                                                    title="Marcar como realizado"
                                                >
                                                    <FaCheck className="w-3 h-3" />
                                                    {updatingId === obs.observation_id ? 'Procesando...' : 'Marcar'}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => updateObservationStatus(obs.observation_id, true)}
                                                    disabled={updatingId === obs.observation_id}
                                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                                        updatingId === obs.observation_id
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            : 'bg-gray-600 text-white hover:bg-gray-700 hover:shadow-md'
                                                    }`}
                                                    title="Marcar como pendiente"
                                                >
                                                    <FaUndo className="w-3 h-3" />
                                                    {updatingId === obs.observation_id ? 'Procesando...' : 'Deshacer'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-12 text-center">
                            <div className="text-gray-400 text-lg mb-2">No hay observaciones registradas</div>
                            <p className="text-gray-500">Las observaciones aparecerán aquí cuando los usuarios las registren.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ObservationsList;
