
import React, { useState } from 'react';
import CreacionUsuario from './CreacionUsuario';
import ModificarUsuario from './ModificarUsuario';
import '../../dashboard/Menu.css';

const UserManagement = () => {
    const [view, setView] = useState(''); // '' | 'crear' | 'modificar'

    // Función para volver al menú principal
    const handleBack = () => setView('');

    return (
        <div style={{ width: '100%', maxWidth: '100%', padding: 0, margin: 0, background: 'none' }}>
            {view === '' && (
                <div className="menu-buttons" style={{ marginBottom: 32, display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center' }}>
                    <button
                        className="menu-btn"
                        style={{ maxWidth: 260, width: '100%' }}
                        onClick={() => setView('crear')}
                    >
                        Crear Nuevo Usuario
                    </button>
                    <button
                        className="menu-btn"
                        style={{ maxWidth: 260, width: '100%' }}
                        onClick={() => setView('modificar')}
                    >
                        Gestionar Usuarios Existentes
                    </button>
                </div>
            )}
            <div>
                {view === 'crear' && <CreacionUsuario onCancel={handleBack} />}
                {view === 'modificar' && <ModificarUsuario onBack={handleBack} />}
            </div>
        </div>
    );
};

export default UserManagement;
