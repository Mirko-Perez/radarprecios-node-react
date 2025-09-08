import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../andes/Andes.css';

const Oriente = () => {
  const navigate = useNavigate();
  return (
    <div className="andes-container">
      <h2>Oriente</h2>
      <div className="andes-buttons">
        <button className="andes-btn" onClick={() => navigate('/oriente/comercio')}>Añadir comercio</button>
        <button className="andes-btn" onClick={() => navigate('/oriente/marca')}>Añadir marca</button>
        <button className="andes-btn" onClick={() => navigate('/oriente/producto')}>Añadir producto</button>
        <button className="andes-btn" onClick={() => navigate('/oriente/precio')}>Añadir precio</button>
        <button className="andes-btn" onClick={() => navigate('/oriente/ver-todo')}>Ver todo</button>
        <button className="andes-btn back-btn" onClick={() => navigate('/region')}>Volver atrás</button>
      </div>
    </div>
  );
};

export default Oriente;
