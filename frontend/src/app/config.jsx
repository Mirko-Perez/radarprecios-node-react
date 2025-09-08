const config = {
    // URL base de la API (sin la barra final)
    // El prefijo /api ya está incluido en las rutas del backend
    API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000'
};

export default config;
