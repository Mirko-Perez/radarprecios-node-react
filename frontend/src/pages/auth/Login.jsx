import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Redirigir si ya está autenticado
  const { user } = useAuth();
  
  useEffect(() => {
    if (isAuthenticated && user) {
      // Determinar la ruta de redirección basada en el permiso del usuario
      let redirectPath = '/menu'; // Ruta por defecto para admin/editor
      
      // Redirigir a regiones solo para viewers (permissionId = 4)
      if (user.permissionId === 4) {
        redirectPath = '/regiones';
      }
      
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Por favor ingrese usuario y contraseña');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }
      
      if (!data.token || !data.user) {
        throw new Error('Respuesta del servidor inválida');
      }
      
      // Llamar a la función de login del contexto
      const success = await login(data.user, data.token);
      
      if (!success) {
        throw new Error('Error al actualizar el estado de autenticación');
      }
      
    } catch (error) {
      setError('Error al iniciar sesión. Por favor, intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page" style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <form 
        className="login-container" 
        onSubmit={handleSubmit}
        style={{
          maxWidth: '350px',
          width: '100%',
          padding: '2rem',
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 2px 16px rgba(0, 0, 0, 0.08)'
        }}>
        <h2 className="text-center mb-4">Iniciar Sesión</h2>
        {error && (
          <div className="alert alert-danger text-center">
            {error}
          </div>
        )}
        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={e => setUsername(e.target.value)}
          autoFocus
          disabled={isSubmitting}
          className="form-control mb-2"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={isSubmitting}
          className="form-control mb-3"
        />
        <button 
          type="submit" 
          className="btn btn-primary w-100"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </button>
      </form>
    </div>
  );
};

export default Login;