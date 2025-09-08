import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NoAccess.css';

const NoAccess = () => {
  const navigate = useNavigate();

  return (
    <div className="no-access-container">
      <h2>Acceso Denegado</h2>
      <p>No tienes los permisos necesarios para acceder a esta sección.</p>
      <button 
        className="back-button"
        onClick={() => navigate(-1)}
      >
        Volver atrás
      </button>
      <button 
        className="home-button"
        onClick={() => navigate('/')}
      >
        Ir al inicio
      </button>
    </div>
  );
};

export default NoAccess;
