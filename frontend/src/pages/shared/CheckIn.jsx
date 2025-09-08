import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Select from 'react-select';
import { AuthContext } from '../../contexts/AuthContext';
import './CheckIn.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const regiones = [
    { id: 1, nombre: 'Andes', ruta: 'andes' },
    { id: 2, nombre: 'Capital', ruta: 'capital' },
    { id: 3, nombre: 'Centro', ruta: 'centro' },
    { id: 4, nombre: 'Centrooccidente', ruta: 'centrooccidente' },
    { id: 5, nombre: 'Occidente', ruta: 'occidente' },
    { id: 6, nombre: 'Oriente', ruta: 'oriente' }
];

const CheckIn = () => {
    const navigate = useNavigate();
    const { user, token } = useContext(AuthContext);
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [stores, setStores] = useState([]);
    const [selectedStore, setSelectedStore] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', isError: false });
    const [activeCheckIn, setActiveCheckIn] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingStores, setIsLoadingStores] = useState(false);
    const [hasLocationPermission, setHasLocationPermission] = useState(null);
    const [observation, setObservation] = useState('');
    const [isSavingObservation, setIsSavingObservation] = useState(false);
    const [observationMessage, setObservationMessage] = useState({ text: '', isError: false });

    // Check for active check-in and location permission on component mount
    useEffect(() => {
        const checkLocationPermission = async () => {
            if (!navigator.permissions) {
                // Permissions API not supported
                setHasLocationPermission(true);
                return;
            }

            try {
                const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
                setHasLocationPermission(permissionStatus.state === 'granted');
                
                permissionStatus.onchange = () => {
                    setHasLocationPermission(permissionStatus.state === 'granted');
                };
            } catch (error) {
                console.error('Error checking location permission:', error);
                setHasLocationPermission(true); // Default to true if there's an error
            }
        };

        const checkActiveCheckIn = async () => {
            try {
                const response = await axios.get(
                    `${API_BASE_URL}/checkins/active`,
                    {
                        headers: { 'Authorization': `Bearer ${token}` },
                        validateStatus: status => status < 500
                    }
                );

                if (response.data && response.data.checkin_id) {
                    setActiveCheckIn(response.data);
                }
            } catch (error) {
                console.error('Error al verificar check-in activo:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (token) {
            checkLocationPermission();
            checkActiveCheckIn();
        } else {
            setIsLoading(false);
        }
    }, [token]);

    // Load stores when a region is selected
    useEffect(() => {
        const fetchStores = async () => {
            if (!selectedRegion) {
                setStores([]);
                return;
            }

            setIsLoadingStores(true);
            try {
                if (!selectedRegion || !selectedRegion.id) {
                    throw new Error('No se ha seleccionado una región válida');
                }
                
                const response = await axios.get(
                    `${API_BASE_URL}/stores/region/${selectedRegion.id}`,
                    { 
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        validateStatus: status => status < 500
                    }
                );

                if (response.status === 200) {
                    setStores(response.data.map(store => ({
                        value: store.store_id,
                        label: store.store_name,
                        ...store
                    })));
                } else {
                    throw new Error(response.data?.message || 'Error al cargar las tiendas');
                }
            } catch (error) {
                console.error('Error al cargar tiendas:', error);
                setMessage({
                    text: 'Error al cargar las tiendas',
                    isError: true
                });
            } finally {
                setIsLoadingStores(false);
            }
        };

        fetchStores();
    }, [selectedRegion, token]);

    const handleRegionChange = (selectedOption) => {
        if (!selectedOption) {
            setSelectedRegion(null);
            setSelectedStore(null);
            return;
        }
        
        // Create a complete region object with all necessary properties
        const region = {
            id: selectedOption.value,
            nombre: selectedOption.label,
            ruta: selectedOption.ruta
        };
        
        setSelectedRegion(region);
        setSelectedStore(null);
        setMessage({ text: '', isError: false });
    };

    const handleStoreChange = (selectedOption) => {
        setSelectedStore(selectedOption);
        setMessage({ text: '', isError: false });
    };

    const handleCheckIn = async (e) => {
        e.preventDefault();

        if (!selectedRegion || !selectedStore) {
            setMessage({
                text: 'Por favor selecciona una región y una tienda',
                isError: true
            });
            return;
        }

        // Check location permission before proceeding
        if (navigator.permissions) {
            const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
            if (permissionStatus.state === 'denied') {
                setMessage({
                    text: 'Debes permitir el acceso a tu ubicación para hacer check-in',
                    isError: true
                });
                return;
            }
        }

        setIsSaving(true);
        setMessage({ text: '', isError: false });

        try {
            // Get user's location
            let latitude = null;
            let longitude = null;

            if (navigator.geolocation) {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                });

                latitude = position.coords.latitude;
                longitude = position.coords.longitude;
            }

            // Create new check-in
            const response = await axios.post(
                `${API_BASE_URL}/checkins`,
                {
                    region_id: selectedRegion.id,
                    store_id: selectedStore.value,
                    latitude,
                    longitude
                },
                { 
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Prepare the check-in data with all required fields
            const checkInData = {
                ...response.data,
                comercio_nombre: selectedStore.label,
                region_nombre: selectedRegion.nombre,
                region_id: selectedRegion.id,  // Ensure region_id is set
                store_id: selectedStore.value, // Ensure store_id is set
                created_at: new Date().toISOString()
            };

            // Update the state with the complete check-in data
            setActiveCheckIn(checkInData);
            
            // Force a state update to ensure the button is enabled
            setTimeout(() => {
                setMessage({
                    text: 'Check-in realizado correctamente',
                    isError: false
                });
                setIsSaving(false);
            }, 0);

        } catch (error) {
            console.error('Error al realizar el check-in:', error);
            const errorMessage = error.response?.data?.message || 'Error al realizar el check-in';
            setMessage({
                text: errorMessage,
                isError: true
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCheckOut = async () => {
        if (!activeCheckIn) return;

        setIsSaving(true);
        setMessage({ text: '', isError: false });

        try {
            await axios.put(
                `${API_BASE_URL}/checkins/${activeCheckIn.checkin_id}/checkout`,
                {},
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                    validateStatus: status => status < 500
                }
            );

            setActiveCheckIn(null);
            setMessage({
                text: 'Check-out realizado correctamente',
                isError: false
            });

        } catch (error) {
            console.error('Error al realizar el check-out:', error);
            const errorMessage = error.response?.data?.message || 'Error al realizar el check-out';
            setMessage({
                text: errorMessage,
                isError: true
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="checkin-container">Cargando...</div>;
    }

    const handleSaveObservation = async () => {
        if (!observation.trim()) {
            setObservationMessage({ text: 'Por favor ingresa una observación', isError: true });
            return;
        }

        try {
            if (!user || !user.id) {
                throw new Error('No se pudo identificar al usuario. Por favor, inicia sesión nuevamente.');
            }

            setIsSavingObservation(true);
            const userId = user.id;

            const response = await axios.post(
                `${API_BASE_URL}/observations`,
                {
                    observation_string: observation,
                    user_id: userId
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data && response.data.success) {
                setObservationMessage({
                    text: 'Observación guardada correctamente',
                    isError: false
                });
                setObservation('');
            } else {
                throw new Error(response.data?.message || 'Error al guardar la observación');
            }
        } catch (error) {
            console.error('Error saving observation:', error);
            setObservationMessage({
                text: error.response?.data?.message || error.message || 'Error al guardar la observación',
                isError: true
            });
        } finally {
            setIsSavingObservation(false);
        }
    };

    return (
        <div className="checkin-container">
            <h2>{activeCheckIn ? 'Check-In Activo' : 'Hacer Check-In'}</h2>

            {message.text && (
                <div className={`message ${message.isError ? 'error' : 'success'}`}>
                    {message.text}
                </div>
            )}

            {activeCheckIn ? (
                <div className="active-checkin">
                    <div className="checkin-info">
                        <p><strong>Región:</strong> {activeCheckIn.region_nombre || 'Desconocida'}</p>
                        <p><strong>Tienda:</strong> {activeCheckIn.comercio_nombre || 'Desconocida'}</p>
                        <p><strong>Iniciado el:</strong> {new Date(activeCheckIn.created_at).toLocaleString()}</p>
                    </div>
                    <div className="checkin-actions">
                        <button
                            className="update-prices-button"
                            onClick={() => {
                                // Ensure we have all required data before navigating
                                if (activeCheckIn?.region_id && activeCheckIn?.store_id) {
                                    navigate('/region', {
                                        state: {
                                            selectedRegion: activeCheckIn.region_id,
                                            selectedStore: activeCheckIn.store_id,
                                            regionName: activeCheckIn.region_nombre,
                                            storeName: activeCheckIn.comercio_nombre
                                        },
                                        replace: false // Ensure we don't replace the history entry
                                    });
                                } else {
                                    // Fallback in case data is missing
                                    navigate('/region');
                                }
                            }}
                            disabled={!activeCheckIn || !activeCheckIn.region_id || !activeCheckIn.store_id}
                        >
                            {isSaving ? 'Cargando...' : 'Actualizar Precios'}
                        </button>
                        <button
                            className="checkout-button"
                            onClick={handleCheckOut}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Procesando...' : 'Hacer Check-Out'}
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <form onSubmit={handleCheckIn}>
                        <div className="form-group">
                            <Select
                                options={regiones.map(region => ({
                                    value: region.id,
                                    label: region.nombre,
                                    ruta: region.ruta
                                }))}
                                value={selectedRegion ? { 
                                    value: selectedRegion.id, 
                                    label: selectedRegion.nombre 
                                } : null}
                                onChange={handleRegionChange}
                                placeholder="Selecciona una región..."
                                isDisabled={isSaving}
                                className="select-input"
                            />
                        </div>
                        <div className="form-group">
                            <Select
                                options={stores}
                                value={selectedStore}
                                onChange={handleStoreChange}
                                placeholder={isLoadingStores ? 'Cargando tiendas...' : 'Selecciona una tienda'}
                                isDisabled={!selectedRegion || isLoadingStores || isSaving}
                                className="select-input"
                            />
                        </div>
                        <div className="form-actions">
                            <button
                                type="submit"
                                className="checkin-btn"
                                disabled={isSaving || !selectedRegion || !selectedStore || hasLocationPermission === false}
                            >
                                {isSaving ? 'Procesando...' : 'Hacer Check-In'}
                            </button>
                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={() => navigate('/')}
                                disabled={isSaving}
                            >
                                Volver al Menú
                            </button>
                        </div>
                    </form>

                    <div className="observation-container" style={{ marginTop: '30px', padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                        <h3>Agregar Observación</h3>
                        <textarea
                            value={observation}
                            onChange={(e) => {
                                setObservation(e.target.value);
                                setObservationMessage({ text: '', isError: false });
                            }}
                            placeholder="Escribe tu observación aquí..."
                            style={{
                                width: '100%',
                                minHeight: '100px',
                                padding: '10px',
                                borderRadius: '4px',
                                border: '1px solid #ccc',
                                marginBottom: '10px',
                                fontFamily: 'Arial, sans-serif',
                                fontSize: '14px'
                            }}
                            disabled={isSavingObservation}
                        />
                        <button
                            onClick={handleSaveObservation}
                            disabled={isSavingObservation || !observation.trim()}
                            style={{
                                backgroundColor: isSavingObservation || !observation.trim() ? '#ccc' : '#4CAF50',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '4px',
                                cursor: isSavingObservation || !observation.trim() ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            {isSavingObservation ? 'Guardando...' : 'Guardar Observación'}
                        </button>
                        {observationMessage.text && (
                            <div style={{
                                marginTop: '10px',
                                color: observationMessage.isError ? '#f44336' : '#4CAF50',
                                fontWeight: 'bold'
                            }}>
                                {observationMessage.text}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default CheckIn;
