import pool from '../config/db.js';

export const getOverviewByRegion = async (req, res) => {
  const { region_id } = req.params;
  
  try {
    // Primero, verifiquemos si la región existe
    const regionCheck = await pool.query('SELECT * FROM regiones WHERE region_id = $1', [region_id]);
    if (regionCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Región no encontrada',
        region_id: parseInt(region_id)
      });
    }

    // Verificar el esquema de las tablas
    const productSchema = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'productos' 
        AND column_name IN ('is_valid')
    `);
    
    const priceSchema = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'precios' 
        AND column_name IN ('is_valid', 'is_current')
    `);
    
    // Construir la consulta basada en los tipos de datos reales
    const isBoolean = (schema, table, column) => {
      const row = schema.rows.find(r => r.column_name === column);
      return row && row.data_type === 'boolean';
    };
    
    const productIsValid = isBoolean(productSchema, 'productos', 'is_valid') ? 'TRUE' : '1';
    const priceIsValid = isBoolean(priceSchema, 'precios', 'is_valid') ? 'TRUE' : '1';
    const priceIsCurrent = isBoolean(priceSchema, 'precios', 'is_current') ? 'TRUE' : '1';
    
    const query = `
      SELECT
        c.store_id, 
        c.store_name,
        g.group_id, 
        g.group_name,
        p.product_id, 
        p.product_name, 
        p.imagen,
        m.brand_id, 
        m.brand_name,
        pr.price_amount,
        p.is_valid as product_valid,
        pr.is_valid as price_valid
      FROM productos p
      JOIN comercios c ON c.region_id = p.region_id
      JOIN grupos g ON g.group_id = p.group_id
      JOIN marcas m ON m.brand_id = p.brand_id
      LEFT JOIN precios pr ON pr.store_id = c.store_id 
        AND pr.product_id = p.product_id 
        AND pr.is_current = ${priceIsCurrent}
        AND pr.is_valid = ${priceIsValid}
      WHERE p.region_id = $1 
        AND p.is_valid = ${productIsValid}
        AND c.region_id = $1
      ORDER BY c.store_name, g.group_name, m.brand_name, p.product_name
    `;

    const result = await pool.query(query, [region_id]);
    
    if (result.rows.length === 0) {
      // Verificar si hay productos válidos en la región
      await pool.query(
        'SELECT COUNT(*) as count FROM productos WHERE region_id = $1 AND is_valid = 1', 
        [region_id]
      );
      
      // Verificar si hay comercios en la región
      await pool.query(
        'SELECT COUNT(*) as count FROM comercios WHERE region_id = $1', 
        [region_id]
      );
    }
    
    const rows = result.rows.map(row => ({
      ...row,
      product_valid: Boolean(row.product_valid),
      price_valid: row.price_amount ? Boolean(row.price_valid) : null
    }));
    
    res.json({
      success: true,
      data: rows,
      region_id: parseInt(region_id),
      count: rows.length
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener el resumen de la región',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor',
      region_id: parseInt(region_id),
      timestamp: new Date().toISOString()
    });
  }
};