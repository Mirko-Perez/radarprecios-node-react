import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Menu.css';

const Menu = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = [1, 2].includes(user?.permissionId);
    const { logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
            navigate('/', { replace: true });
        } catch (error) {
            // Error handling without console.log
        }
    };

    return (
        <div className="menu-container">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                <img 
                    src="/logo-fritz.png" 
                    alt="Fritz Logo" 
                    style={{ height: '50px', width: 'auto' }} 
                />
                <h2>Menú Principal</h2>
            </div>
            <div className="menu-buttons">
                <button 
                    className="menu-button" 
                    onClick={() => navigate('/check-in')}
                >
                    Hacer Check-In
                </button>
                
                {isAdmin && (
                    <button 
                        className="menu-button" 
                        onClick={() => navigate('/admin')}
                    >
                        Panel de Administración
                    </button>
                )}
                
                <button 
                    className="menu-button" 
                    onClick={handleLogout}
                >
                    Cerrar Sesión
                </button>
            </div>
        </div>
    );
};

export default Menu;