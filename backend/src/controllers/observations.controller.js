import pool from '../config/db.js';

export const getObservations = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                observation_id, 
                observation_string, 
                user_id, 
                created_at,
                is_active 
             FROM observaciones 
             WHERE is_active = true 
             ORDER BY created_at DESC`
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
    const { observation_string, user_id, is_active = true } = req.body;
    
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
        
        // Insertar la observación
        const result = await client.query(
            `INSERT INTO observaciones (observation_string, user_id, is_active, created_at)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
             RETURNING *`,
            [observation_string.trim(), user_id, is_active]
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
