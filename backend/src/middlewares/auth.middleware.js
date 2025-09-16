import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

// Clave secreta para verificar el token (debe coincidir con la usada para firmar)
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_muy_segura';

/**
 * Middleware para autenticar el token JWT en las peticiones
 */
const authenticateToken = async (req, res, next) => {
    // Obtener el token del header 'Authorization'
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Token de autenticación no proporcionado o en formato incorrecto'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verificar y decodificar el token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Verificar que el usuario existe y está activo
        const userResult = await pool.query(
            'SELECT user_id, username, is_active FROM usuarios WHERE user_id = $1',
            [decoded.userId]
        );

        if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado o inactivo'
            });
        }

        // Obtener los permisos del usuario
        const permissionsResult = await pool.query(
            `SELECT p.permission_id, p.permission_name 
             FROM permisos p
             JOIN usuario_permiso up ON p.permission_id = up.permission_id
             WHERE up.user_id = $1`,
            [decoded.userId]
        );

        // Agregar la información del usuario a la petición
        req.user = {
            userId: decoded.userId,
            username: decoded.username,
            permissionId: decoded.permissionId,
            permissions: permissionsResult.rows.map(p => p.permission_name)
        };

        // Continuar con la siguiente función de middleware
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado',
                expiredAt: error.expiredAt
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Error al autenticar el token',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export { authenticateToken };
