import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../admin/dashboard/Dashboard';
import { useAuth } from '../../contexts/AuthContext';

import DashboardAvanzado from '../admin/dashboard/DashboardAvanzado';
import UserManagement from '../admin/users/UserManagement';
import MenuParametros from '../admin/products/MenuParametros';
import GestionProductos from '../admin/products/GestionProductos';
import '../admin/shared/MenuAdmin.css';
import ObservationsList from '../admin/dashboard/ObservationsList';

const MenuAdmin = () => {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('dashboard');
    const { user } = useAuth();

    // Cierra el sidebar al navegar
    const handleNavigate = (section) => {
        setActiveSection(section);
        setSidebarOpen(false);
    };

    // Obtiene el nombre de la sección activa para la barra superior
    const getSectionTitle = () => {
        switch (activeSection) {
            case 'dashboard':
                return 'Dashboard';
            case 'dashboard-avanzado':
                return 'Dashboard Avanzado';
            case 'gestion-usuarios':
                return 'Mantenedor de Usuarios';
            case 'parametros':
                return 'Mantenedor de Parámetros';
            case 'gestion-productos':
                return 'Gestión de Productos';
            case 'observaciones':
                return 'Observaciones';
            default:
                return 'Panel de Administración';
        }
    };

    // Renderiza el contenido dinámico según la sección activa
    const renderContent = () => {
        switch (activeSection) {
            case 'dashboard':
                return <Dashboard />;
            case 'dashboard-avanzado':
                return <DashboardAvanzado />;
            case 'gestion-usuarios':
                return <UserManagement />;
            case 'parametros':
                return <MenuParametros />;
            case 'gestion-productos':
                return <GestionProductos />;
            case 'observaciones':
                return <ObservationsList />;
            default:
                return (
                    <>
                        <h1 style={{ fontSize: '2em', color: '#2c3e50', marginBottom: 24 }}>Bienvenido al Panel de Administración</h1>
                        <p style={{ color: '#555', fontSize: '1.1em' }}>
                            Selecciona una opción del menú para comenzar a gestionar el sistema.
                        </p>
                    </>
                );
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f8fa' }}>
            {/* Botón hamburguesa solo visible en móvil */}
            <button
                className={`menu-admin-hamburger${sidebarOpen ? ' open' : ''}`}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Abrir menú"
            >
                <span />
                <span />
                <span />
            </button>
            <aside className={`menu-admin-sidebar${sidebarOpen ? ' show' : ''}`} style={{ width: 220, minHeight: '100vh', height: '100vh' }}>
                <div className="menu-admin-logo" style={{ height: '80px', display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
                    <img src="/logo-fritz.png" alt="Fritz Inventario" style={{ height: 28, marginRight: 8 }} />
                    <span style={{ color: '#1976d2', fontWeight: 700, fontSize: '1.3em', lineHeight: 1.1 }}>Radar de Precio</span>
                </div>
                <nav className="menu-admin-list" style={{ paddingTop: 12 }}>
                    <button className={`menu-admin-item${activeSection === 'dashboard' ? ' active' : ''}`} onClick={() => handleNavigate('dashboard')}>Dashboard</button>
                    <button className={`menu-admin-item${activeSection === 'dashboard-avanzado' ? ' active' : ''}`} onClick={() => handleNavigate('dashboard-avanzado')}>Dashboard Avanzado</button>
                    <button className={`menu-admin-item${activeSection === 'gestion-usuarios' ? ' active' : ''}`} onClick={() => handleNavigate('gestion-usuarios')}>Mantenedor de Usuarios</button>
                    <button className={`menu-admin-item${activeSection === 'parametros' ? ' active' : ''}`} onClick={() => handleNavigate('parametros')}>Mantenedor de Parámetros</button>
                    <button className={`menu-admin-item${activeSection === 'gestion-productos' ? ' active' : ''}`} onClick={() => handleNavigate('gestion-productos')}>Gestión de Productos</button>
                    <button className={`menu-admin-item${activeSection === 'observaciones' ? ' active' : ''}`} onClick={() => handleNavigate('observaciones')}>Observaciones</button>
                </nav>
                <div className="menu-admin-bottom">
                    <button className="menu-admin-item" style={{ backgroundColor: '#808080', color: '#fff' }} onClick={() => navigate('/menu')}>Volver atrás</button>
                </div>
            </aside>
            <main style={{ flex: 1, padding: '0', marginLeft: 220, minHeight: '100vh', background: '#f7f8fa', display: 'flex', flexDirection: 'column' }}>
                {/* Barra superior con el nombre de la sección */}
                <div style={{
                    width: '100%',
                    background: '#fff',
                    borderBottom: '1px solid #e5e7eb',
                    paddingLeft: '32px', // Separar el nombre de la visualización de la barra lateral
                    paddingRight: '40px',
                    height: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '2em',
                    fontWeight: 700,
                    color: '#1976d2',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    boxSizing: 'border-box',
                    marginBottom: 0,
                    justifyContent: 'space-between' // Para alinear el nombre de usuario a la derecha
                }}>
                    <span style={{ display: 'inline-block' }}>{getSectionTitle()}</span>
                    <span style={{ fontSize: '1em', fontWeight: 400, color: '#333', textTransform: 'none' }}>
                        {user?.name || user?.username || user?.email || 'Usuario'}
                    </span>
                </div>
                <div style={{ flex: 1, padding: '40px 32px 32px 32px', width: '100%', boxSizing: 'border-box' }}>
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default MenuAdmin;
