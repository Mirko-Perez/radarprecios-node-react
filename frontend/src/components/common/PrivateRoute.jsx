import { useCallback, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

// Rutas permitidas para viewers (permission_id = 4)
const ALLOWED_VIEWER_PATHS = [
  "/regiones",
  "/region",
  "/menu",
  "/check-in",
  "/foto-anaquel",
  "/mi-agenda",
  "/logout", // Permitir cierre de sesión
];

// Regiones permitidas para las rutas de ver-todo
const ALLOWED_REGIONS = [
  "andes",
  "capital",
  "centro",
  "centrooccidente", // Corregido: cambiado de 'centroccidente' a 'centrooccidente'
  "occidente",
  "oriente",
];

// Componente de carga
const LoadingSpinner = () => (
  <div
    className="d-flex justify-content-center align-items-center"
    style={{ height: "100vh" }}
  >
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Cargando...</span>
    </div>
  </div>
);

// Función para verificar si una ruta está permitida para el viewer
const isViewerPathAllowed = (path) => {
  // Normalizar la ruta
  const normalizedPath = path.endsWith("/") ? path.slice(0, -1) : path;

  // Verificar rutas permitidas directamente
  if (ALLOWED_VIEWER_PATHS.some((p) => normalizedPath === p)) {
    return true;
  }

  // Verificar rutas de ver-todo en formato /regiones/[region]/ver-todo
  if (normalizedPath.startsWith("/regiones/")) {
    const subPath = normalizedPath.replace("/regiones/", "");

    // Solo permitir /regiones/[region]/ver-todo
    if (subPath.endsWith("/ver-todo") || subPath === "ver-todo") {
      const regionName = subPath
        .replace("/ver-todo", "")
        .replace("ver-todo", "");
      return ALLOWED_REGIONS.includes(regionName);
    }

    // No permitir /regiones/[region] sin /ver-todo
    return false;
  }

  // Verificar rutas de ver-todo en formato /[region]/ver-todo
  if (normalizedPath.endsWith("/ver-todo")) {
    const region = normalizedPath
      .replace("/ver-todo", "")
      .replace(/^\//, "")
      .toLowerCase();
    return ALLOWED_REGIONS.includes(region);
  }

  // No permitir acceso directo a /[region], solo a /[region]/ver-todo
  // Eliminamos esta sección para evitar el acceso directo a /andes, /capital, etc.

  return false;
};

const PrivateRoute = ({ children, requireAdmin = false }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const currentPath = location.pathname;

  // Función para verificar la autorización
  const checkAuthorization = useCallback(() => {
    if (loading) return false;

    // Si no está autenticado, no está autorizado
    if (!isAuthenticated) {
      return false;
    }

    // Si es un viewer (permission_id = 4), verificar rutas permitidas
    if (user?.permissionId === 4) {
      const isPathAllowed = isViewerPathAllowed(currentPath);
      if (!isPathAllowed) {
        return false;
      }
      return true;
    }

    // Si se requiere ser administrador, verificar el permissionId
    if (requireAdmin) {
      return user?.permissionId <= 2;
    }

    // Si solo se requiere autenticación
    return true;
  }, [isAuthenticated, user, requireAdmin, loading, currentPath]);

  useEffect(() => {
    if (!loading) {
      setIsAuthorized(checkAuthorization());
      setIsChecking(false);
    }
  }, [loading, checkAuthorization]);

  // Mostrar carga mientras se verifica la autenticación
  if (loading || isChecking) {
    return <LoadingSpinner />;
  }

  // Si no está autorizado, redirigir al inicio
  if (!isAuthorized) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Si está autorizado, mostrar el contenido protegido
  return children;
};

export default PrivateRoute;
