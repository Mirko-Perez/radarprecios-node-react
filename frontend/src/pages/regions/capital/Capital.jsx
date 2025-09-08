import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../andes/Andes.css';

const Capital = () => {
  const navigate = useNavigate();

  return (
    <div className="andes-container">
      <h2>Capital</h2>
      <div className="andes-buttons">
        <button className="andes-btn" onClick={() => navigate('/capital/comercio')}>Añadir comercio</button>
        <button className="andes-btn" onClick={() => navigate('/capital/marca')}>Añadir marca</button>
        <button className="andes-btn" onClick={() => navigate('/capital/producto')}>Añadir producto</button>
        <button className="andes-btn" onClick={() => navigate('/capital/precio')}>Añadir precio</button>
        <button className="andes-btn" onClick={() => navigate('/capital/ver-todo')}>Ver todo</button>
        <button className="andes-btn back-btn" onClick={() => navigate('/region')}>Volver atrás</button>
      </div>
    </div>
  );
};

export default Capital;
