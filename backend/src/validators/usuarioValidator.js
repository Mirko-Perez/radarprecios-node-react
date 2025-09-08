import { body } from 'express-validator';

export const crearUsuarioRules = [
    body('username')
        .trim()
        .notEmpty().withMessage('El nombre de usuario es requerido')
        .isLength({ min: 3, max: 50 }).withMessage('El nombre de usuario debe tener entre 3 y 50 caracteres')
        .matches(/^[a-zA-Z0-9_.-]+$/).withMessage('El nombre de usuario solo puede contener letras, números, puntos, guiones bajos y guiones'),
    
    body('password')
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
    
    body('permission_id')
        .isInt({ min: 2, max: 4 }).withMessage('El ID de permiso no es válido')
];
