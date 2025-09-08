import pool from '../config/db.js';

export const getGroups = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM grupos ORDER BY group_name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener grupos', error: error.message });
  }
};