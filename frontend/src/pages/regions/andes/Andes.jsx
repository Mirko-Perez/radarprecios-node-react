import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Andes.css';

const Andes = () => {
    const navigate = useNavigate();

    return (
        <div className="andes-container">
            <h2>Andes</h2>
            <div className="andes-buttons">
                <button className="andes-btn" onClick={() => navigate('/andes/comercio')}>Añadir comercio</button>
                <button className="andes-btn" onClick={() => navigate('/andes/marca')}>Añadir marca</button>
                <button className="andes-btn" onClick={() => navigate('/andes/producto')}>Añadir producto</button>
                <button className="andes-btn" onClick={() => navigate('/andes/precio')}>Añadir precio</button>
                <button className="andes-btn" onClick={() => navigate('/andes/ver-todo')}>Ver todo</button>
                <button
                    className="andes-btn back-btn"
                    onClick={() => navigate('/region')}
                >
                    Volver atrás
                </button>
            </div>
        </div>
    );
};

export default Andes;