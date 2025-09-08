import pool from '../config/db.js';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';

/**
 * Crea un nuevo usuario en el sistema
 * Solo accesible por administradores
 */
const crearUsuario = async (req, res) => {
    const client = await pool.connect();
    
    try {
        // Verificar errores de validación
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                message: 'Error de validación',
                errors: errors.array()
            });
        }

        const { username, password, permission_id } = req.body;
        const currentUserId = req.user.userId;
        const currentUserPermissionId = req.user.permissionId;

        // Iniciar transacción
        await client.query('BEGIN');

        // 1. Verificar si el usuario actual tiene permisos para crear usuarios
        if (currentUserPermissionId !== 1 && currentUserPermissionId !== 2) {
            await client.query('ROLLBACK');
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para realizar esta acción'
            });
        }

        // 2. Verificar si el usuario actual es admin (no superadmin) y está intentando crear un admin
        if (currentUserPermissionId === 2 && (permission_id === 1 || permission_id === 2)) {
            await client.query('ROLLBACK');
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para crear usuarios administradores'
            });
        }

        // 3. Verificar si el nombre de usuario ya existe
        const usuarioExistente = await client.query(
            'SELECT user_id FROM usuarios WHERE username = $1',
            [username]
        );

        if (usuarioExistente.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'El nombre de usuario ya está en uso'
            });
        }

        // 4. Insertar el nuevo usuario con bcrypt para la contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        const result = await client.query(
            `INSERT INTO usuarios (username, password_hash, is_active)
             VALUES ($1, $2, 1)
             RETURNING user_id, username, is_active`,
            [username, hashedPassword]
        );

        const nuevoUsuario = result.rows[0];

        // 5. Asignar el permiso al usuario
        await client.query(
            'INSERT INTO usuario_permiso (user_id, permission_id) VALUES ($1, $2)',
            [nuevoUsuario.user_id, permission_id]
        );
        
        // Obtener el nombre del permiso asignado
        const permisoResult = await client.query(
            'SELECT permission_name FROM permisos WHERE permission_id = $1',
            [permission_id]
        );
        const nombrePermiso = permisoResult.rows[0]?.permission_name || 'Desconocido';

        // Confirmar transacción
        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            data: {
                user_id: nuevoUsuario.user_id,
                username: nuevoUsuario.username,
                permission_id: permission_id,
                permission_name: nombrePermiso,
                is_active: nuevoUsuario.is_active
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');

        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al crear el usuario',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        client.release();
    }
};

/**
 * Obtiene la lista de usuarios con sus permisos
 * Solo accesible por administradores
 */
const listarUsuarios = async (req, res) => {
    const client = await pool.connect();
    const currentUserPermissionId = req.user.permissionId;
    
    try {
        // Construir la consulta según los permisos del usuario actual
        let query = `
            SELECT 
                u.user_id,
                u.username,
                u.is_active,
                p.permission_id,
                p.permission_name
            FROM usuarios u
            LEFT JOIN usuario_permiso up ON u.user_id = up.user_id
            LEFT JOIN permisos p ON up.permission_id = p.permission_id
            WHERE 1=1
        `;
        
        const params = [];
        
        // Si el usuario es admin (no superadmin), solo puede ver editores y viewers
        if (currentUserPermissionId === 2) {
            query += ` AND p.permission_id IN (3, 4)`;
        }
        
        query += ` ORDER BY u.username`;
        
        const result = await client.query(query, params);
        
        // Agrupar usuarios por ID para manejar múltiples permisos
        const usuariosMap = new Map();
        
        result.rows.forEach(row => {
            if (!usuariosMap.has(row.user_id)) {
                usuariosMap.set(row.user_id, {
                    user_id: row.user_id,
                    username: row.username,
                    is_active: row.is_active,
                    permission_id: row.permission_id,
                    permission_name: row.permission_name
                });
            }
        });
        
        res.status(200).json({
            success: true,
            data: Array.from(usuariosMap.values())
        });
        
    } catch (error) {

        res.status(500).json({
            success: false,
            message: 'Error al listar usuarios',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        client.release();
    }
};

/**
 * Actualiza el estado de un usuario (activo/inactivo)
 * Solo accesible por administradores
 */
const actualizarEstadoUsuario = async (req, res) => {
    const client = await pool.connect();
    const { userId } = req.params;
    const { is_active } = req.body;
    const currentUserPermissionId = req.user.permissionId;
    
    try {
        await client.query('BEGIN');
        
        // 1. Verificar si el usuario actual tiene permisos
        if (currentUserPermissionId !== 1 && currentUserPermissionId !== 2) {
            await client.query('ROLLBACK');
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para realizar esta acción'
            });
        }
        
        // 2. Obtener el usuario a actualizar
        const usuarioResult = await client.query(
            `SELECT u.user_id, up.permission_id
             FROM usuarios u
             LEFT JOIN usuario_permiso up ON u.user_id = up.user_id
             WHERE u.user_id = $1`,
            [userId]
        );
        
        if (usuarioResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        const usuario = usuarioResult.rows[0];
        
        // 3. Verificar permisos (admin no puede modificar a otros admins o superadmins)
        if (currentUserPermissionId === 2 && 
            (usuario.permission_id === 1 || usuario.permission_id === 2)) {
            await client.query('ROLLBACK');
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para modificar este usuario'
            });
        }
        
        // 4. Actualizar el estado del usuario
        await client.query(
            'UPDATE usuarios SET is_active = $1 WHERE user_id = $2',
            [is_active ? 1 : 0, userId]
        );
        
        await client.query('COMMIT');
        
        res.status(200).json({
            success: true,
            message: 'Estado del usuario actualizado correctamente',
            data: {
                user_id: userId,
                is_active: is_active ? 1 : 0
            }
        });
        
    } catch (error) {
        await client.query('ROLLBACK');

        res.status(500).json({
            success: false,
            message: 'Error al actualizar el estado del usuario',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        client.release();
    }
};

export { 
    crearUsuario, 
    listarUsuarios, 
    actualizarEstadoUsuario 
};
