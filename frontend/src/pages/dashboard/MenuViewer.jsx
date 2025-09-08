import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Menu.css';

const MenuViewer = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const regiones = ['Andes', 'Capital', 'Centro', 'Centrooccidente', 'Occidente', 'Oriente'];

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleRegionClick = (region) => {
        // Convertir el nombre de la región a minúsculas para la URL
        const regionLower = region.toLowerCase();
        // Navegar a la ruta correspondiente de ver-todo
        navigate(`/${regionLower}/ver-todo`);
    };

    return (
        <div className="menu-container">
            <h2>Seleccione una Región</h2>
            <div className="menu-buttons">
                {regiones.map((region) => (
                    <button 
                        key={region}
                        className="menu-btn"
                        onClick={() => handleRegionClick(region)}
                    >
                        {region}
                    </button>
                ))}
                <button className="menu-btn logout-btn" onClick={handleLogout}>
                    Cerrar sesión
                </button>
            </div>
        </div>
    );
};

export default MenuViewer;
