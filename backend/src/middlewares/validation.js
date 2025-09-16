import { body, param, query, validationResult } from 'express-validator';

// Middleware para manejar errores de validación
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array()
    });
  }
  next();
};

// Validaciones para regiones
export const validateRegion = [
  body('region_name')
    .notEmpty()
    .withMessage('El nombre de la región es obligatorio')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 255 })
    .withMessage('La descripción no puede exceder 255 caracteres')
    .trim(),
  handleValidationErrors
];

export const validateRegionId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de región inválido'),
  handleValidationErrors
];

// Validaciones para grupos
export const validateGroup = [
  body('group_name')
    .notEmpty()
    .withMessage('El nombre del grupo es obligatorio')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 255 })
    .withMessage('La descripción no puede exceder 255 caracteres')
    .trim(),
  handleValidationErrors
];

export const validateGroupId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de grupo inválido'),
  handleValidationErrors
];

// Validaciones para marcas
export const validateBrand = [
  body('brand_name')
    .notEmpty()
    .withMessage('El nombre de la marca es obligatorio')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .trim(),
  body('store_id')
    .isInt({ min: 1 })
    .withMessage('ID de tienda inválido'),
  handleValidationErrors
];

export const validateBrandId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de marca inválido'),
  handleValidationErrors
];

// Validaciones para comercios
export const validateStore = [
  body('store_name')
    .notEmpty()
    .withMessage('El nombre del comercio es obligatorio')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .trim(),
  body('region_id')
    .isInt({ min: 1 })
    .withMessage('ID de región inválido'),
  body('address')
    .optional()
    .isLength({ max: 255 })
    .withMessage('La dirección no puede exceder 255 caracteres')
    .trim(),
  body('co_cli')
    .optional()
    .isLength({ max: 50 })
    .withMessage('El código cliente no puede exceder 50 caracteres')
    .trim(),
  body('segmento')
    .optional()
    .isLength({ max: 50 })
    .withMessage('El segmento no puede exceder 50 caracteres')
    .trim(),
  body('ciudad')
    .optional()
    .isLength({ max: 100 })
    .withMessage('La ciudad no puede exceder 100 caracteres')
    .trim(),
  handleValidationErrors
];

export const validateStoreId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de comercio inválido'),
  handleValidationErrors
];

// Validaciones para productos
export const validateProduct = [
  body('product_name')
    .notEmpty()
    .withMessage('El nombre del producto es obligatorio')
    .isLength({ min: 2, max: 200 })
    .withMessage('El nombre debe tener entre 2 y 200 caracteres')
    .trim(),
  body('brand_id')
    .isInt({ min: 1 })
    .withMessage('ID de marca inválido'),
  body('group_id')
    .isInt({ min: 1 })
    .withMessage('ID de grupo inválido'),
  body('region_id')
    .isInt({ min: 1 })
    .withMessage('ID de región inválido'),
  handleValidationErrors
];

export const validateProductId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de producto inválido'),
  handleValidationErrors
];

export const validateProductStatus = [
  param('product_id')
    .isInt({ min: 1 })
    .withMessage('ID de producto inválido'),
  body('is_valid')
    .isBoolean()
    .withMessage('El estado debe ser verdadero o falso'),
  handleValidationErrors
];

// Validaciones para precios
export const validatePrice = [
  body('product_id')
    .isInt({ min: 1 })
    .withMessage('ID de producto inválido'),
  body('store_id')
    .isInt({ min: 1 })
    .withMessage('ID de comercio inválido'),
  body('price_amount')
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número positivo'),
  body('quantity')
    .optional()
    .isLength({ max: 50 })
    .withMessage('La cantidad no puede exceder 50 caracteres')
    .trim(),
  handleValidationErrors
];

// Validaciones para autenticación
export const validateLogin = [
  body('username')
    .notEmpty()
    .withMessage('El nombre de usuario es obligatorio')
    .isLength({ min: 3, max: 50 })
    .withMessage('El usuario debe tener entre 3 y 50 caracteres')
    .trim(),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es obligatoria')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  handleValidationErrors
];

// Validaciones para creación de usuarios
export const validateUserCreation = [
  body('username')
    .notEmpty()
    .withMessage('El nombre de usuario es obligatorio')
    .isLength({ min: 3, max: 50 })
    .withMessage('El usuario debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('El usuario solo puede contener letras, números y guiones bajos')
    .trim(),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es obligatoria')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  body('permission_id')
    .isInt({ min: 1, max: 4 })
    .withMessage('ID de permiso inválido'),
  handleValidationErrors
];

// Validaciones para query parameters
export const validateRegionQuery = [
  query('region_id')
    .optional()
    .custom((value) => {
      if (value === 'all') return true;
      return Number.isInteger(parseInt(value)) && parseInt(value) > 0;
    })
    .withMessage('ID de región inválido'),
  handleValidationErrors
];

export const validateTimeRange = [
  query('time_range')
    .optional()
    .isIn(['7days', '30days', '90days', 'year'])
    .withMessage('Rango de tiempo inválido'),
  handleValidationErrors
];

export const validateLimit = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe ser entre 1 y 100'),
  handleValidationErrors
];
