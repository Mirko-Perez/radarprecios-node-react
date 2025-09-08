import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../andes/Andes.css';

const Centrooccidente = () => {
  const navigate = useNavigate();
  return (
    <div className="andes-container">
      <h2>Centrooccidente</h2>
      <div className="andes-buttons">
        <button className="andes-btn" onClick={() => navigate('/centrooccidente/comercio')}>Añadir comercio</button>
        <button className="andes-btn" onClick={() => navigate('/centrooccidente/marca')}>Añadir marca</button>
        <button className="andes-btn" onClick={() => navigate('/centrooccidente/producto')}>Añadir producto</button>
        <button className="andes-btn" onClick={() => navigate('/centrooccidente/precio')}>Añadir precio</button>
        <button className="andes-btn" onClick={() => navigate('/centrooccidente/ver-todo')}>Ver todo</button>
        <button className="andes-btn back-btn" onClick={() => navigate('/region')}>Volver atrás</button>
      </div>
    </div>
  );
};

export default Centrooccidente;
