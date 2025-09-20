import pool from '../config/db.js';

export const createCheckIn = async (req, res) => {
    const { region_id, store_id, latitude, longitude } = req.body;
    const user_id = req.user.userId; // Usando el ID del usuario del token JWT

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Verificar que el usuario existe
        const userResult = await client.query('SELECT user_id FROM usuarios WHERE user_id = $1', [user_id]);
        if (userResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Verificar que la región existe
        const regionResult = await client.query('SELECT region_id FROM regiones WHERE region_id = $1', [region_id]);
        if (regionResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Región no encontrada' });
        }

        // Verificar que el comercio existe
        const storeResult = await client.query('SELECT store_id FROM comercios WHERE store_id = $1', [store_id]);
        if (storeResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Comercio no encontrado' });
        }

        // Verificar si ya hay un check-in activo para este usuario
        const activeCheckIn = await client.query(
            'SELECT checkin_id FROM checkins WHERE user_id = $1 AND is_active = TRUE',
            [user_id]
        );

        // Si hay un check-in activo, lo cerramos
        if (activeCheckIn.rows.length > 0) {
            await client.query(
                'UPDATE checkins SET checkout = CURRENT_TIMESTAMP, is_active = FALSE WHERE checkin_id = $1',
                [activeCheckIn.rows[0].checkin_id]
            );
        }

        // Crear el nuevo check-in
        const result = await client.query(
            `INSERT INTO checkins 
             (user_id, region_id, store_id, latitude, longitude, created_at, is_active) 
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, TRUE) 
             RETURNING *`,
            [user_id, region_id, store_id, latitude, longitude]
        );

        await client.query('COMMIT');
        
        res.status(201).json({
            success: true,
            message: 'Check-in realizado exitosamente',
            data: result.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en check-in:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error interno del servidor', 
            error: error.message 
        });
    } finally {
        client.release();
    }
};

export const createCheckOut = async (req, res) => {
    const user_id = req.user.userId;

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Buscar el check-in activo del usuario
        const activeCheckIn = await client.query(
            'SELECT checkin_id FROM checkins WHERE user_id = $1 AND is_active = TRUE',
            [user_id]
        );

        if (activeCheckIn.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ 
                success: false,
                message: 'No hay check-in activo para cerrar' 
            });
        }

        // Realizar el check-out
        const result = await client.query(
            'UPDATE checkins SET checkout = CURRENT_TIMESTAMP, is_active = FALSE WHERE checkin_id = $1 RETURNING *',
            [activeCheckIn.rows[0].checkin_id]
        );

        await client.query('COMMIT');
        
        res.status(200).json({
            success: true,
            message: 'Check-out realizado exitosamente',
            data: result.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en check-out:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error interno del servidor', 
            error: error.message 
        });
    } finally {
        client.release();
    }
};

export const getUserCheckIns = async (req, res) => {
    const user_id = req.user.userId;

    try {
        const result = await pool.query(
            `SELECT 
                c.*,
                r.region_name,
                s.store_name
             FROM checkins c
             JOIN regiones r ON c.region_id = r.region_id
             JOIN comercios s ON c.store_id = s.store_id
             WHERE c.user_id = $1
             ORDER BY c.created_at DESC`,
            [user_id]
        );

        res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error al obtener check-ins:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error interno del servidor', 
            error: error.message 
        });
    }
};

export const getActiveCheckIn = async (req, res) => {
    const user_id = req.user.userId;

    try {
        const result = await pool.query(
            `SELECT 
                c.*,
                r.region_name,
                s.store_name
             FROM checkins c
             JOIN regiones r ON c.region_id = r.region_id
             JOIN comercios s ON c.store_id = s.store_id
             WHERE c.user_id = $1 AND c.is_active = TRUE`,
            [user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No hay check-in activo'
            });
        }

        res.status(200).json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error al obtener check-in activo:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error interno del servidor', 
            error: error.message 
        });
    }
};
