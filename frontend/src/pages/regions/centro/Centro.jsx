import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../andes/Andes.css';

const Centro = () => {
  const navigate = useNavigate();
  return (
    <div className="andes-container">
      <h2>Centro</h2>
      <div className="andes-buttons">
        <button className="andes-btn" onClick={() => navigate('/centro/comercio')}>Añadir comercio</button>
        <button className="andes-btn" onClick={() => navigate('/centro/marca')}>Añadir marca</button>
        <button className="andes-btn" onClick={() => navigate('/centro/producto')}>Añadir producto</button>
        <button className="andes-btn" onClick={() => navigate('/centro/precio')}>Añadir precio</button>
        <button className="andes-btn" onClick={() => navigate('/centro/ver-todo')}>Ver todo</button>
        <button className="andes-btn back-btn" onClick={() => navigate('/region')}>Volver atrás</button>
      </div>
    </div>
  );
};

export default Centro;
