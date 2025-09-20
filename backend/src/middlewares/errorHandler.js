// Middleware para manejo centralizado de errores
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Error de validación de express-validator
  if (err.type === 'validation') {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: err.errors
    });
  }

  // Error de base de datos
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        return res.status(409).json({
          success: false,
          message: 'Ya existe un registro con esos datos',
          error: 'DUPLICATE_ENTRY'
        });
      case '23503': // Foreign key violation
        return res.status(400).json({
          success: false,
          message: 'Referencia inválida a otro registro',
          error: 'FOREIGN_KEY_VIOLATION'
        });
      case '23502': // Not null violation
        return res.status(400).json({
          success: false,
          message: 'Faltan campos obligatorios',
          error: 'MISSING_REQUIRED_FIELDS'
        });
      default:
        return res.status(500).json({
          success: false,
          message: 'Error en la base de datos',
          error: 'DATABASE_ERROR'
        });
    }
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido',
      error: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expirado',
      error: 'EXPIRED_TOKEN'
    });
  }

  // Error de Multer (archivos)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'El archivo es demasiado grande',
      error: 'FILE_TOO_LARGE'
    });
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      message: 'Demasiados archivos',
      error: 'TOO_MANY_FILES'
    });
  }

  // Error personalizado
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message || 'Error personalizado',
      error: err.code || 'CUSTOM_ERROR'
    });
  }

  // Error genérico del servidor
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: 'INTERNAL_SERVER_ERROR'
  });
};

// Middleware para manejar rutas no encontradas
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada`,
    error: 'NOT_FOUND'
  });
};

// Función para crear errores personalizados
export const createError = (message, statusCode = 500, code = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};
