import React, { useState } from 'react';
import CrearComercio from './CrearComercio';
import CrearMarca from './CrearMarca';
import CrearProducto from './CrearProducto';
import '../../dashboard/Menu.css';

const MenuParametros = () => {
    const [view, setView] = useState(''); // '' | 'comercio' | 'marca' | 'producto'

    const handleBack = () => setView('');

    return (
        <div style={{ width: '100%', maxWidth: '100%', padding: 0, margin: 0, background: 'none' }}>
            {view === '' && (
                <div className="menu-buttons" style={{ marginBottom: 32, display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center' }}>
                    <button
                        className="menu-btn"
                        style={{ maxWidth: 260, width: '100%' }}
                        onClick={() => setView('comercio')}
                    >
                        Crear Comercio
                    </button>
                    <button
                        className="menu-btn"
                        style={{ maxWidth: 260, width: '100%' }}
                        onClick={() => setView('marca')}
                    >
                        Crear Marca
                    </button>
                    <button
                        className="menu-btn"
                        style={{ maxWidth: 260, width: '100%' }}
                        onClick={() => setView('producto')}
                    >
                        Crear Producto
                    </button>
                </div>
            )}
            <div>
                {view === 'comercio' && <CrearComercio onCancel={handleBack} />}
                {view === 'marca' && <CrearMarca onCancel={handleBack} />}
                {view === 'producto' && <CrearProducto onCancel={handleBack} />}
            </div>
        </div>
    );
};

export default MenuParametros;
