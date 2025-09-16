import pool from '../config/db.js';

// GET /api/regions - Obtener todas las regiones
export const getAllRegions = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM regiones ORDER BY region_name');
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener regiones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener regiones',
      error: error.message
    });
  }
};

// GET /api/regions/:id - Obtener región por ID
export const getRegionById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('SELECT * FROM regiones WHERE region_id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Región no encontrada'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener región:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener región',
      error: error.message
    });
  }
};

// POST /api/regions - Crear nueva región
export const createRegion = async (req, res) => {
  const { region_name, description } = req.body;

  try {
    // Verificar si ya existe una región con el mismo nombre
    const existingRegion = await pool.query(
      'SELECT region_id FROM regiones WHERE region_name = $1',
      [region_name]
    );

    if (existingRegion.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una región con ese nombre'
      });
    }

    const result = await pool.query(
      'INSERT INTO regiones (region_name, description) VALUES ($1, $2) RETURNING *',
      [region_name, description || null]
    );

    res.status(201).json({
      success: true,
      message: 'Región creada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear región:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear región',
      error: error.message
    });
  }
};

// PUT /api/regions/:id - Actualizar región
export const updateRegion = async (req, res) => {
  const { id } = req.params;
  const { region_name, description } = req.body;

  try {
    // Verificar si la región existe
    const existingRegion = await pool.query(
      'SELECT region_id FROM regiones WHERE region_id = $1',
      [id]
    );

    if (existingRegion.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Región no encontrada'
      });
    }

    // Verificar si ya existe otra región con el mismo nombre
    const duplicateRegion = await pool.query(
      'SELECT region_id FROM regiones WHERE region_name = $1 AND region_id != $2',
      [region_name, id]
    );

    if (duplicateRegion.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe otra región con ese nombre'
      });
    }

    const result = await pool.query(
      'UPDATE regiones SET region_name = $1, description = $2 WHERE region_id = $3 RETURNING *',
      [region_name, description || null, id]
    );

    res.json({
      success: true,
      message: 'Región actualizada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar región:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar región',
      error: error.message
    });
  }
};

// DELETE /api/regions/:id - Eliminar región
export const deleteRegion = async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar si la región tiene comercios asociados
    const storesCount = await pool.query(
      'SELECT COUNT(*) FROM comercios WHERE region_id = $1',
      [id]
    );

    if (parseInt(storesCount.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar la región porque tiene comercios asociados'
      });
    }

    // Verificar si la región tiene productos asociados
    const productsCount = await pool.query(
      'SELECT COUNT(*) FROM productos WHERE region_id = $1',
      [id]
    );

    if (parseInt(productsCount.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar la región porque tiene productos asociados'
      });
    }

    const result = await pool.query(
      'DELETE FROM regiones WHERE region_id = $1 RETURNING region_name',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Región no encontrada'
      });
    }

    res.json({
      success: true,
      message: `Región "${result.rows[0].region_name}" eliminada exitosamente`
    });
  } catch (error) {
    console.error('Error al eliminar región:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar región',
      error: error.message
    });
  }
};
