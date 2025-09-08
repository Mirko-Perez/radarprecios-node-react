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
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, TRUE) RETURNING checkin_id`,
            [user_id, region_id, store_id, latitude, longitude]
        );

        await client.query('COMMIT');
        
        res.status(201).json({
            checkin_id: result.rows[0].checkin_id,
            message: 'Check-in creado exitosamente'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al crear check-in:', error);
        res.status(500).json({ message: 'Error al crear check-in', error: error.message });
    } finally {
        client.release();
    }
};

export const getActiveCheckIn = async (req, res) => {
    const user_id = req.user.userId; // Usando el ID del usuario del token JWT
    const client = await pool.connect();

    try {
        // Primero obtenemos el check-in activo
        const result = await client.query(
            `SELECT checkin_id, user_id, region_id, store_id, 
                    latitude, longitude, created_at, checkout, is_active
             FROM checkins 
             WHERE user_id = $1 AND is_active = TRUE`,
            [user_id]
        );
        
        // Si encontramos un check-in activo, obtenemos la información de la región y el comercio
        if (result.rows.length > 0) {
            const checkIn = result.rows[0];
            const [regionResult, storeResult] = await Promise.all([
                client.query('SELECT region_name FROM regiones WHERE region_id = $1', [checkIn.region_id]),
                client.query('SELECT store_name FROM comercios WHERE store_id = $1', [checkIn.store_id])
            ]);
            
            // Agregamos la información de la región y el comercio al resultado
            result.rows[0] = {
                ...checkIn,
                region_nombre: regionResult.rows[0]?.region_name || 'Desconocida',
                comercio_nombre: storeResult.rows[0]?.store_name || 'Desconocido'
            };
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No hay check-in activo' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener check-in activo:', error);
        res.status(500).json({ message: 'Error al obtener check-in activo', error: error.message });
    } finally {
        client.release();
    }
};

export const checkout = async (req, res) => {
    const { checkin_id } = req.params;
    const user_id = req.user.userId; // Usando el ID del usuario del token JWT
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Verificar que el check-in existe y pertenece al usuario
        const checkInResult = await client.query(
            'SELECT checkin_id FROM checkins WHERE checkin_id = $1 AND user_id = $2 AND is_active = TRUE',
            [checkin_id, user_id]
        );

        if (checkInResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Check-in no encontrado o ya cerrado' });
        }

        // Actualizar el check-out
        await client.query(
            'UPDATE checkins SET checkout = CURRENT_TIMESTAMP, is_active = FALSE WHERE checkin_id = $1',
            [checkin_id]
        );

        await client.query('COMMIT');
        res.json({ message: 'Check-out realizado exitosamente' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al hacer check-out:', error);
        res.status(500).json({ message: 'Error al hacer check-out', error: error.message });
    } finally {
        client.release();
    }
};
