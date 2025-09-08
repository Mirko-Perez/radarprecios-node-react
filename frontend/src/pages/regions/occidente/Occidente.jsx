import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../andes/Andes.css';

const Occidente = () => {
    const navigate = useNavigate();

    return (
        <div className="andes-container">
            <h2>Occidente</h2>
            <div className="andes-buttons">
                <button className="andes-btn" onClick={() => navigate('/occidente/comercio')}>Añadir comercio</button>
                <button className="andes-btn" onClick={() => navigate('/occidente/marca')}>Añadir marca</button>
                <button className="andes-btn" onClick={() => navigate('/occidente/producto')}>Añadir producto</button>
                <button className="andes-btn" onClick={() => navigate('/occidente/precio')}>Añadir precio</button>
                <button className="andes-btn" onClick={() => navigate('/occidente/ver-todo')}>Ver todo</button>
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

export default Occidente;
