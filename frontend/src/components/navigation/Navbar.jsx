import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import usePermissions from '../../hooks/usePermissions';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { can, isAdmin } = usePermissions();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="navbar-logo">
          Radar de Precios
        </Link>
      </div>
      
      <div className="navbar-menu">
        <div className="navbar-start">
          <Link to="/" className="navbar-item">
            Inicio
          </Link>
          
          {can('view') && (
            <div className="navbar-item has-dropdown is-hoverable">
              <span className="navbar-link">Regiones</span>
              <div className="navbar-dropdown">
                <Link to="/andes" className="navbar-item">Andes</Link>
                <Link to="/capital" className="navbar-item">Capital</Link>
                <Link to="/centro" className="navbar-item">Centro</Link>
                <Link to="/centrooccidente" className="navbar-item">Centrooccidente</Link>
                <Link to="/occidente" className="navbar-item">Occidente</Link>
                <Link to="/oriente" className="navbar-item">Oriente</Link>
              </div>
            </div>
          )}
          
          {isAdmin && (
            <div className="navbar-item has-dropdown is-hoverable">
              <span className="navbar-link">Administración</span>
              <div className="navbar-dropdown">
                <Link to="/admin/users" className="navbar-item">Usuarios</Link>
                <Link to="/admin/logs" className="navbar-item">Registros</Link>
              </div>
            </div>
          )}
        </div>
        
        <div className="navbar-end">
          <div className="navbar-item has-dropdown is-hoverable">
            <span className="navbar-link">
              <span className="icon-text">
                <span className="icon">
                  <i className="fas fa-user"></i>
                </span>
                <span>{user.username}</span>
              </span>
            </span>
            <div className="navbar-dropdown is-right">
              <Link to="/profile" className="navbar-item">
                <span className="icon-text">
                  <span className="icon">
                    <i className="fas fa-user-cog"></i>
                  </span>
                  <span>Perfil</span>
                </span>
              </Link>
              <hr className="navbar-divider" />
              <a className="navbar-item" onClick={handleLogout}>
                <span className="icon-text has-text-danger">
                  <span className="icon">
                    <i className="fas fa-sign-out-alt"></i>
                  </span>
                  <span>Cerrar sesión</span>
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
