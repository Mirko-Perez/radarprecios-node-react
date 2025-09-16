import pool from '../config/db.js';

// GET /api/brands - Obtener todas las marcas, opcionalmente filtradas por store_id
export const getAllBrands = async (req, res) => {
  try {
    const { store_id } = req.query;
    let query = `
      SELECT 
        b.*,
        s.store_name
      FROM marcas b
      LEFT JOIN comercios s ON b.store_id = s.store_id
    `;
    let params = [];

    if (store_id) {
      query += ' WHERE b.store_id = $1';
      params.push(store_id);
    }

    query += ' ORDER BY b.brand_name';

    const result = await pool.query(query, params);
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener marcas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener marcas',
      error: error.message
    });
  }
};

// GET /api/brands/:id - Obtener marca por ID
export const getBrandById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT 
        b.*,
        s.store_name
      FROM marcas b
      LEFT JOIN comercios s ON b.store_id = s.store_id
      WHERE b.brand_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Marca no encontrada'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener marca:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener marca',
      error: error.message
    });
  }
};

// GET /api/brands/store/:store_id - Obtener marcas por tienda
export const getBrandsByStore = async (req, res) => {
  const { store_id } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT 
        b.*,
        s.store_name
      FROM marcas b
      LEFT JOIN comercios s ON b.store_id = s.store_id
      WHERE b.store_id = $1
      ORDER BY b.brand_name
    `, [store_id]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener marcas por tienda:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener marcas por tienda',
      error: error.message
    });
  }
};

// POST /api/brands - Crear nueva marca
export const createBrand = async (req, res) => {
  const { brand_name, store_id } = req.body;

  try {
    // Verificar si ya existe una marca con el mismo nombre en la misma tienda
    const existingBrand = await pool.query(
      'SELECT brand_id FROM marcas WHERE brand_name = $1 AND store_id = $2',
      [brand_name, store_id]
    );

    if (existingBrand.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una marca con ese nombre en esta tienda'
      });
    }

    const result = await pool.query(
      'INSERT INTO marcas (brand_name, store_id) VALUES ($1, $2) RETURNING *',
      [brand_name, store_id]
    );

    res.status(201).json({
      success: true,
      message: 'Marca creada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear marca:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear marca',
      error: error.message
    });
  }
};

// PUT /api/brands/:id - Actualizar marca
export const updateBrand = async (req, res) => {
  const { id } = req.params;
  const { brand_name, store_id } = req.body;

  try {
    // Verificar si la marca existe
    const existingBrand = await pool.query(
      'SELECT brand_id FROM marcas WHERE brand_id = $1',
      [id]
    );

    if (existingBrand.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Marca no encontrada'
      });
    }

    // Verificar si ya existe otra marca con el mismo nombre en la misma tienda
    const duplicateBrand = await pool.query(
      'SELECT brand_id FROM marcas WHERE brand_name = $1 AND store_id = $2 AND brand_id != $3',
      [brand_name, store_id, id]
    );

    if (duplicateBrand.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe otra marca con ese nombre en esta tienda'
      });
    }

    const result = await pool.query(
      'UPDATE marcas SET brand_name = $1, store_id = $2 WHERE brand_id = $3 RETURNING *',
      [brand_name, store_id, id]
    );

    res.json({
      success: true,
      message: 'Marca actualizada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar marca:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar marca',
      error: error.message
    });
  }
};

// DELETE /api/brands/:id - Eliminar marca
export const deleteBrand = async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar si la marca tiene productos asociados
    const productsCount = await pool.query(
      'SELECT COUNT(*) FROM productos WHERE brand_id = $1',
      [id]
    );

    if (parseInt(productsCount.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar la marca porque tiene productos asociados'
      });
    }

    const result = await pool.query(
      'DELETE FROM marcas WHERE brand_id = $1 RETURNING brand_name',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Marca no encontrada'
      });
    }

    res.json({
      success: true,
      message: `Marca "${result.rows[0].brand_name}" eliminada exitosamente`
    });
  } catch (error) {
    console.error('Error al eliminar marca:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar marca',
      error: error.message
    });
  }
};

// GET /api/brands/:id/price-stats - Obtener estadísticas de precios de una marca
export const getBrandPriceStats = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        b.brand_name,
        COUNT(DISTINCT p.product_id) as total_products,
        COUNT(pr.price_id) as total_prices,
        AVG(pr.price_amount) as average_price,
        MIN(pr.price_amount) as min_price,
        MAX(pr.price_amount) as max_price
      FROM marcas b
      LEFT JOIN productos p ON b.brand_id = p.brand_id
      LEFT JOIN precios pr ON p.product_id = pr.product_id
      WHERE b.brand_id = $1
      GROUP BY b.brand_id, b.brand_name
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Marca no encontrada'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de marca:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de marca',
      error: error.message
    });
  }
};
