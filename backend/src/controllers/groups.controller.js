import pool from '../config/db.js';

// GET /api/groups - Obtener todos los grupos
export const getAllGroups = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM grupos ORDER BY group_name');
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener grupos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener grupos',
      error: error.message
    });
  }
};

// GET /api/groups/:id - Obtener grupo por ID
export const getGroupById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('SELECT * FROM grupos WHERE group_id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Grupo no encontrado'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener grupo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener grupo',
      error: error.message
    });
  }
};

// POST /api/groups - Crear nuevo grupo
export const createGroup = async (req, res) => {
  const { group_name, description } = req.body;

  try {
    // Verificar si ya existe un grupo con el mismo nombre
    const existingGroup = await pool.query(
      'SELECT group_id FROM grupos WHERE group_name = $1',
      [group_name]
    );

    if (existingGroup.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un grupo con ese nombre'
      });
    }

    const result = await pool.query(
      'INSERT INTO grupos (group_name, description) VALUES ($1, $2) RETURNING *',
      [group_name, description || null]
    );

    res.status(201).json({
      success: true,
      message: 'Grupo creado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear grupo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear grupo',
      error: error.message
    });
  }
};

// PUT /api/groups/:id - Actualizar grupo
export const updateGroup = async (req, res) => {
  const { id } = req.params;
  const { group_name, description } = req.body;

  try {
    // Verificar si el grupo existe
    const existingGroup = await pool.query(
      'SELECT group_id FROM grupos WHERE group_id = $1',
      [id]
    );

    if (existingGroup.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Grupo no encontrado'
      });
    }

    // Verificar si ya existe otro grupo con el mismo nombre
    const duplicateGroup = await pool.query(
      'SELECT group_id FROM grupos WHERE group_name = $1 AND group_id != $2',
      [group_name, id]
    );

    if (duplicateGroup.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe otro grupo con ese nombre'
      });
    }

    const result = await pool.query(
      'UPDATE grupos SET group_name = $1, description = $2 WHERE group_id = $3 RETURNING *',
      [group_name, description || null, id]
    );

    res.json({
      success: true,
      message: 'Grupo actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar grupo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar grupo',
      error: error.message
    });
  }
};

// DELETE /api/groups/:id - Eliminar grupo
export const deleteGroup = async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar si el grupo tiene productos asociados
    const productsCount = await pool.query(
      'SELECT COUNT(*) FROM productos WHERE group_id = $1',
      [id]
    );

    if (parseInt(productsCount.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el grupo porque tiene productos asociados'
      });
    }

    const result = await pool.query(
      'DELETE FROM grupos WHERE group_id = $1 RETURNING group_name',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Grupo no encontrado'
      });
    }

    res.json({
      success: true,
      message: `Grupo "${result.rows[0].group_name}" eliminado exitosamente`
    });
  } catch (error) {
    console.error('Error al eliminar grupo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar grupo',
      error: error.message
    });
  }
};
