import pool from '../config/db.js';

// Obtener todas las regiones
export const getAllRegions = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM regiones ORDER BY region_name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener regiones', error: error.message });
  }
};
