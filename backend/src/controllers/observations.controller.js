import pool from '../config/db.js';

export const getObservations = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                o.observation_id, 
                o.observation_string, 
                o.user_id,
                o.checkin_id,
                o.created_at,
                o.is_active,
                u.username,
                u.email,
                c.region_id,
                c.store_id,
                r.region_name,
                s.store_name,
                s.store_address
             FROM observaciones o
             LEFT JOIN usuarios u ON o.user_id = u.user_id
             LEFT JOIN checkins c ON o.checkin_id = c.checkin_id
             LEFT JOIN regiones r ON c.region_id = r.region_id
             LEFT JOIN comercios s ON c.store_id = s.store_id
             WHERE o.is_active = true 
             ORDER BY o.created_at DESC`
        );
        
        res.status(200).json({
            success: true,
            data: result.rows
        });
        
    } catch (error) {
        console.error('Error al obtener las observaciones:', error);
        
        if (error.code) {
            return res.status(400).json({
                success: false,
                message: 'Error en la base de datos',
                error: error.message,
                code: error.code,
                detail: error.detail
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

export const updateObservationStatus = async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
        return res.status(400).json({
            success: false,
            message: 'El estado de la observación es requerido y debe ser un valor booleano'
        });
    }

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const result = await client.query(
            `UPDATE observaciones 
             SET is_active = $1 
             WHERE observation_id = $2 
             RETURNING *`,
            [is_active, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Observación no encontrada'
            });
        }
        
        await client.query('COMMIT');
        
        res.status(200).json({
            success: true,
            message: `Observación marcada como ${is_active ? 'activa' : 'realizada'}`,
            data: result.rows[0]
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar la observación:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la observación',
            error: error.message
        });
    } finally {
        client.release();
    }
};

export const addObservation = async (req, res) => {
    const { observation_string, user_id, checkin_id, is_active = true } = req.body;
    
    // Validar campos requeridos
    if (!observation_string?.trim()) {
        return res.status(400).json({ 
            success: false,
            message: 'El texto de la observación es requerido' 
        });
    }
    
    if (!user_id) {
        return res.status(400).json({ 
            success: false,
            message: 'ID de usuario es requerido' 
        });
    }

    const client = await pool.connect();
    
    try {
        // Iniciar transacción
        await client.query('BEGIN');
        
        // Verificar que el usuario existe
        const userCheck = await client.query(
            'SELECT user_id FROM usuarios WHERE user_id = $1',
            [user_id]
        );
        
        if (userCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Si se proporciona checkin_id, verificar que existe y pertenece al usuario
        if (checkin_id) {
            const checkinCheck = await client.query(
                'SELECT checkin_id FROM checkins WHERE checkin_id = $1 AND user_id = $2',
                [checkin_id, user_id]
            );
            
            if (checkinCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({
                    success: false,
                    message: 'Check-in no encontrado o no pertenece al usuario'
                });
            }
        }
        
        // Insertar la observación
        const result = await client.query(
            `INSERT INTO observaciones (observation_string, user_id, checkin_id, is_active, created_at)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
             RETURNING *`,
            [observation_string.trim(), user_id, checkin_id, is_active]
        );
        
        await client.query('COMMIT');
        
        res.status(201).json({
            success: true,
            message: 'Observación guardada correctamente',
            data: result.rows[0]
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al guardar la observación:', error);
        
        // Manejar errores específicos de la base de datos
        if (error.code) {
            return res.status(400).json({
                success: false,
                message: 'Error en la base de datos',
                error: error.message,
                code: error.code,
                detail: error.detail
            });
        }
        
        // Manejar otros errores
        res.status(500).json({ 
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
        
    } finally {
        client.release();
    }
};

// Nueva función para obtener observaciones con información completa
export const getObservationsWithDetails = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                o.observation_id, 
                o.observation_string, 
                o.user_id,
                o.checkin_id,
                o.created_at,
                o.is_active,
                u.username,
                u.email,
                c.region_id,
                c.store_id,
                c.created_at as checkin_date,
                r.region_name,
                s.store_name,
                s.address
             FROM observaciones o
             LEFT JOIN usuarios u ON o.user_id = u.user_id
             LEFT JOIN checkins c ON o.checkin_id = c.checkin_id
             LEFT JOIN regiones r ON c.region_id = r.region_id
             LEFT JOIN comercios s ON c.store_id = s.store_id
             ORDER BY o.created_at DESC`
        );
        
        res.status(200).json({
            success: true,
            data: result.rows
        });
        
    } catch (error) {
        console.error('Error al obtener las observaciones con detalles:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};
