import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Rutas permitidas para viewers (permission_id = 4)
const ALLOWED_VIEWER_PATHS = [
  '/regiones',
  '/logout' // Permitir cierre de sesión
];

// Rutas de ver-todo permitidas para viewers
const ALLOWED_VER_TODO_PATHS = [
  'andes',
  'capital',
  'centro',
  'centroccidente',
  'occidente',
  'oriente'
];

// Función para verificar si una ruta está permitida para el viewer
const isViewerPathAllowed = (path) => {
  // Normalizar la ruta
  const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;
  
  // Verificar rutas permitidas directamente
  if (ALLOWED_VIEWER_PATHS.some(p => normalizedPath === p)) {
    return true;
  }
  
  // Verificar rutas de ver-todo
  if (normalizedPath.startsWith('/regiones/')) {
    const subPath = normalizedPath.replace('/regiones/', '');
    const [region] = subPath.split('/');
    
    // Permitir /regiones/[region]/ver-todo
    if (subPath.endsWith('/ver-todo') || subPath === 'ver-todo') {
      const regionName = subPath.replace('/ver-todo', '').replace('ver-todo', '');
      return ALLOWED_VER_TODO_PATHS.includes(regionName);
    }
    
    // Permitir /regiones/[region] (sin nada más)
    if (subPath === region && ALLOWED_VER_TODO_PATHS.includes(region)) {
      return true;
    }
  }
  
  return false;
};

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Verificar si se requieren permisos de administrador
  if (requireAdmin && user?.permissionId > 2) {
    return <Navigate to="/menu" replace />;
  }

  // Restricciones para viewers (permission_id = 4)
  if (user?.permissionId === 4) {
    // Verificar si la ruta actual está permitida para viewers
    const isPathAllowed = isViewerPathAllowed(currentPath);

    if (!isPathAllowed) {
      // Redirigir a la página de regiones si el viewer intenta acceder a una ruta no permitida
      return <Navigate to="/regiones" replace />;
    }
  }

  // Usuario autenticado y con los permisos necesarios
  return children;
};

export default ProtectedRoute;
