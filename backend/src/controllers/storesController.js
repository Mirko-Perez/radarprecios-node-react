import pool from '../config/db.js';

// Obtener comercios por región
export const getStoresByRegion = async (req, res) => {
  const { region_id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM comercios WHERE region_id = $1 ORDER BY store_name',
      [region_id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener comercios', error: error.message });
  }
};

// Agregar comercio nuevo
export const addStore = async (req, res) => {
  const { store_name, region_id } = req.body;
  if (!store_name || !region_id) {
    return res.status(400).json({ message: 'Faltan datos' });
  }
  try {
    const similar = await pool.query(
      "SELECT * FROM comercios WHERE region_id = $1 AND LOWER(store_name) LIKE LOWER($2)",
      [region_id, `%${store_name}%`]
    );
    if (similar.rows.length > 0) {
      return res.status(409).json({ message: 'Ya existe un comercio con ese nombre o similar', similares: similar.rows });
    }
    const result = await pool.query(
      'INSERT INTO comercios (store_name, region_id) VALUES ($1, $2) RETURNING *',
      [store_name, region_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error al agregar comercio', error: error.message });
  }
};