import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import '../shared/AdminForms.css';

const ModificarUsuario = (props) => {
    const { onBack } = props;
    const [usuarios, setUsuarios] = useState([]);
    const [filtro, setFiltro] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const { user } = useAuth();

    // Obtener la lista de usuarios
    useEffect(() => {
        const obtenerUsuarios = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/usuarios`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Error al cargar los usuarios');
                }

                setUsuarios(data.data || []);
            } catch (err) {
                setError('Error al cargar los usuarios. Por favor, intente de nuevo.');
            } finally {
                setLoading(false);
            }
        };

        obtenerUsuarios();
    }, []);

    // Cambiar el estado de activación del usuario
    const toggleEstadoUsuario = async (userId, estadoActual) => {
        if (!window.confirm(`¿Estás seguro de que deseas ${estadoActual ? 'deshabilitar' : 'habilitar'} este usuario?`)) {
            return;
        }

        try {
            setLoading(true);
            setError('');

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/usuarios/${userId}/estado`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ is_active: !estadoActual })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al actualizar el estado del usuario');
            }

            // Actualizar el estado local
            setUsuarios(usuarios.map(usuario =>
                usuario.user_id === userId
                    ? { ...usuario, is_active: !estadoActual }
                    : usuario
            ));

            setSuccess(`Usuario ${!estadoActual ? 'habilitado' : 'deshabilitado'} correctamente`);

            // Limpiar mensaje de éxito después de 3 segundos
            setTimeout(() => setSuccess(''), 3000);

        } catch (err) {
            setError('Error al actualizar el estado del usuario. Por favor, intente de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    // Filtrar usuarios según el término de búsqueda
    const usuariosFiltrados = usuarios.filter(usuario =>
        usuario.username.toLowerCase().includes(filtro.toLowerCase())
    );

    if (loading) {
        return (
            <div className="admin-form-container">
                <div className="loading">Cargando usuarios...</div>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', maxWidth: '100%', margin: '0 auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.08)', padding: 32 }}>
            <div className="d-flex align-items-center mb-4">
                <button
                    onClick={onBack}
                    className="btn btn-outline-secondary btn-sm"
                >
                    Volver
                </button>
            </div>
            {error && <div className="alert alert-danger mb-3">{error}</div>}
            {success && <div className="alert alert-success mb-3">{success}</div>}
            <div className="mb-3">
                <div className="input-group">
                    <span className="input-group-text">
                        🔍
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar por nombre de usuario..."
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                        className="form-control"
                    />
                </div>
            </div>
            <div className="table-responsive" style={{ minWidth: 0 }}>
                <table className="table table-hover align-middle" style={{ minWidth: 900 }}>
                    <thead className="table-light">
                        <tr>
                            <th>ID</th>
                            <th>Usuario</th>
                            <th className="d-none d-md-table-cell">Rol</th>
                            <th>Estado</th>
                            <th className="text-end">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuariosFiltrados.length > 0 ? (
                            usuariosFiltrados.map(usuario => (
                                <tr key={usuario.user_id}>
                                    <td className="fw-bold">{usuario.user_id}</td>
                                    <td>{usuario.username}</td>
                                    <td className="d-none d-md-table-cell">
                                        {usuario.permission_id === 1 ? 'Super Admin' :
                                            usuario.permission_id === 2 ? 'Admin' :
                                                usuario.permission_id === 3 ? 'Editor' : 'Viewer'}
                                    </td>
                                    <td>
                                        <span className={`badge ${usuario.is_active ? 'bg-success' : 'bg-secondary'}`}>
                                            {usuario.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="text-end">
                                        <button
                                            className={`btn btn-sm ${usuario.is_active ? 'btn-danger' : 'btn-success'}`}
                                            onClick={() => toggleEstadoUsuario(usuario.user_id, usuario.is_active)}
                                            disabled={usuario.user_id === user?.id}
                                            style={{
                                                backgroundColor: usuario.is_active ? '#dc3545' : '#198754',
                                                borderColor: usuario.is_active ? '#dc3545' : '#198754',
                                                color: 'white'
                                            }}
                                            title={usuario.user_id === user?.id ? 'No puedes modificar tu propio estado' : ''}
                                        >
                                            {usuario.is_active ? 'Deshabilitar' : 'Habilitar'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center py-4 text-muted">
                                    No se encontraron usuarios que coincidan con la búsqueda
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ModificarUsuario;
