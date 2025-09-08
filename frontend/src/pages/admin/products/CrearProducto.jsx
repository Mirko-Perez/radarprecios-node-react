import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import '../../dashboard/Menu.css';

const CrearProducto = ({ onCancel }) => {
    const imageInputRef = useRef(null);
    const [nombre, setNombre] = useState('');
    const [regionId, setRegionId] = useState('');
    const [storeId, setStoreId] = useState('');
    const [brandId, setBrandId] = useState('');
    const [grupoId, setGrupoId] = useState('');
    const [imagen, setImagen] = useState(null);
    const [preview, setPreview] = useState('');
    const [regiones, setRegiones] = useState([]);
    const [stores, setStores] = useState([]);
    const [brands, setBrands] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingStores, setLoadingStores] = useState(false);
    const [loadingBrands, setLoadingBrands] = useState(false);
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
                    headers: { 'Authorization': `Bearer ${token}` }
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

    // Cargar tiendas cuando se selecciona una región
    useEffect(() => {
        const fetchStores = async () => {
            if (!regionId) {
                setStores([]);
                setStoreId('');
                setBrands([]);
                setBrandId('');
                return;
            }

            setLoadingStores(true);
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/stores/region/${regionId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setStores(response.data || []);
            } catch (err) {
                console.error('Error fetching stores:', err);
                setError('Error al cargar las tiendas de la región');
            } finally {
                setLoadingStores(false);
            }
        };

        fetchStores();
    }, [regionId, API_URL]);

    // Cargar marcas cuando se selecciona una tienda
    useEffect(() => {
        const fetchBrands = async () => {
            if (!storeId) {
                setBrands([]);
                setBrandId('');
                return;
            }

            setLoadingBrands(true);
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/brands/store/${storeId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setBrands(response.data || []);
            } catch (err) {
                console.error('Error fetching brands:', err);
                setError('Error al cargar las marcas de la tienda');
            } finally {
                setLoadingBrands(false);
            }
        };

        fetchBrands();
    }, [storeId, API_URL]);

    // Cargar grupos
    useEffect(() => {
        const fetchGrupos = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/groups`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setGrupos(response.data || []);
                // Seleccionar el primer grupo por defecto si existe
                if (response.data && response.data.length > 0) {
                    setGrupoId(response.data[0].group_id);
                }
            } catch (err) {
                console.error('Error fetching groups:', err);
                setError('Error al cargar los grupos');
            }
        };

        fetchGrupos();
    }, [API_URL]);

    // Manejar cambio de imagen
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImagen(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!nombre.trim() || !regionId || !storeId || !brandId || !grupoId || !imagen) {
            setError('Por favor completa todos los campos obligatorios, incluyendo la imagen');
            return;
        }

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('product_name', nombre.trim());
            formData.append('brand_id', brandId);
            formData.append('region_id', regionId);
            formData.append('group_id', grupoId);

            // Add timestamp to image filename to ensure uniqueness
            const timestamp = new Date().getTime();
            const fileName = `${timestamp}_${imagen.name}`;
            formData.append('imagen', imagen, fileName);

            await axios.post(`${API_URL}/products`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setSuccess('Producto creado exitosamente');
            setNombre('');
            setRegionId('');
            setStoreId('');
            setBrandId('');
            setImagen(null);
            setPreview('');
            // Clear the file input value
            if (imageInputRef.current) {
                imageInputRef.current.value = '';
            }
        } catch (err) {
            console.error('Error creating product:', err);
            setError(err.response?.data?.message || 'Error al crear el producto');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="loading">Cargando...</div>;
    }

    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-md-8 col-lg-6">
                    <div className="card shadow-sm">
                        <div className="card-header bg-primary text-white">
                            <h4 className="mb-0">Crear Nuevo Producto</h4>
                        </div>
                        <div className="card-body">
                            {error && <div className="alert alert-danger mb-3">{error}</div>}
                            {success && <div className="alert alert-success mb-3">{success}</div>}

                            <form onSubmit={handleSubmit} className="needs-validation" noValidate>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label htmlFor="region" className="form-label">Región *</label>
                                        <select
                                            id="region"
                                            className="form-select"
                                            value={regionId}
                                            onChange={(e) => {
                                                setRegionId(e.target.value);
                                                setStoreId('');
                                                setBrandId('');
                                            }}
                                            disabled={submitting}
                                            required
                                        >
                                            <option value="">Seleccione una región</option>
                                            {regiones.map(region => (
                                                <option key={region.region_id} value={region.region_id}>
                                                    {region.region_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-md-6">
                                        <label htmlFor="store" className="form-label">Comercio *</label>
                                        <select
                                            id="store"
                                            className="form-select"
                                            value={storeId}
                                            onChange={(e) => setStoreId(e.target.value)}
                                            disabled={!regionId || loadingStores || submitting}
                                            required
                                        >
                                            <option value="">Seleccione un comercio</option>
                                            {stores.map(store => (
                                                <option key={store.store_id} value={store.store_id}>
                                                    {store.store_name}
                                                </option>
                                            ))}
                                        </select>
                                        {loadingStores && <div className="form-text">Cargando comercios...</div>}
                                    </div>
                                </div>

                                <div className="row g-3 mt-2">
                                    <div className="col-md-6">
                                        <label htmlFor="brand" className="form-label">Marca *</label>
                                        <select
                                            id="brand"
                                            className="form-select"
                                            value={brandId}
                                            onChange={(e) => setBrandId(e.target.value)}
                                            disabled={!storeId || loadingBrands || submitting}
                                            required
                                        >
                                            <option value="">Seleccione una marca</option>
                                            {brands.map(brand => (
                                                <option key={brand.brand_id} value={brand.brand_id}>
                                                    {brand.brand_name}
                                                </option>
                                            ))}
                                        </select>
                                        {loadingBrands && <div className="form-text">Cargando marcas...</div>}
                                    </div>

                                    <div className="col-md-6">
                                        <label htmlFor="grupo" className="form-label">Grupo *</label>
                                        <select
                                            id="grupo"
                                            className="form-select"
                                            value={grupoId}
                                            onChange={(e) => setGrupoId(e.target.value)}
                                            disabled={submitting}
                                            required
                                        >
                                            {grupos.map(grupo => (
                                                <option key={grupo.group_id} value={grupo.group_id}>
                                                    {grupo.group_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="mb-3 mt-3">
                                    <label htmlFor="nombre" className="form-label">Nombre del Producto *</label>
                                    <input
                                        type="text"
                                        id="nombre"
                                        className="form-control"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        disabled={submitting}
                                        placeholder="Ingrese el nombre del producto"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="imagen" className="form-label">Imagen</label>
                                    <input
                                        type="file"
                                        id="imagen"
                                        className="form-control"
                                        onChange={handleImageChange}
                                        accept="image/*"
                                        disabled={submitting}
                                        ref={imageInputRef}
                                    />
                                    {preview && (
                                        <div className="mt-2 text-center">
                                            <img
                                                src={preview}
                                                alt="Vista previa"
                                                className="img-thumbnail"
                                                style={{ maxWidth: '200px', maxHeight: '200px' }}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="d-flex justify-content-between mt-4">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={onCancel}
                                        disabled={submitting}
                                    >
                                        <i className="bi bi-arrow-left me-1"></i> Volver
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-save me-1"></i> Guardar Producto
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
};

export default CrearProducto;
