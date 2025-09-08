import pool from '../config/db.js';

// Obtener estadísticas de precios por marca
export const getBrandPriceStats = async (req, res) => {
  try {
    const { regionId, groupId } = req.query;
    
    // Construir la consulta dinámicamente basada en los filtros
    let query = `
      WITH filtered_products AS (
        SELECT 
          p.product_id,
          p.brand_id,
          p.region_id,
          p.group_id
        FROM 
          productos p
        JOIN 
          precios pr ON p.product_id = pr.product_id
        WHERE 
          p.is_valid = 1 
          AND pr.is_valid = 1 
          AND pr.is_current = true
          ${regionId === 'all' ? '' : 'AND p.region_id = $1'}
          ${groupId ? (regionId === 'all' ? 'AND p.group_id = $1' : 'AND p.group_id = $2') : ''}
      ),
      brand_stats AS (
        SELECT 
          b.brand_name,
          AVG(pr.price_amount) AS avg_price,
          COUNT(DISTINCT p.product_id) AS product_count
        FROM 
          filtered_products fp
        JOIN 
          productos p ON fp.product_id = p.product_id
        JOIN 
          precios pr ON p.product_id = pr.product_id
        JOIN
          marcas b ON p.brand_id = b.brand_id
        GROUP BY 
          b.brand_name
      )
      SELECT 
        brand_name AS brand,
        ROUND(avg_price::numeric, 2) AS average_price,
        product_count AS product_count,
        CASE
          WHEN avg_price > (SELECT AVG(avg_price) * 1.2 FROM brand_stats) THEN 'Premium'
          WHEN avg_price < (SELECT AVG(avg_price) * 0.8 FROM brand_stats) THEN 'Económico'
          ELSE 'Medio'
        END AS price_segment,
        ROUND((avg_price / NULLIF((SELECT AVG(avg_price) FROM brand_stats), 0) - 1) * 100, 2) AS vs_average_percentage
      FROM 
        brand_stats
      ORDER BY 
        avg_price DESC;
    `;
    
    // Ejecutar la consulta con los parámetros apropiados
    const params = [];
    if (regionId && regionId !== 'all') params.push(regionId);
    if (groupId) params.push(groupId);
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener estadísticas de marcas', error: error.message });
  }
};

// Obtener todas las marcas, opcionalmente filtradas por store_id
export const getBrands = async (req, res) => {
  try {
    const { store_id } = req.query;
    let query = 'SELECT * FROM marcas';
    const params = [];
    
    if (store_id) {
      query += ' WHERE store_id = $1';
      params.push(store_id);
    }
    
    query += ' ORDER BY brand_name';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener marcas', error: error.message });
  }
};

// Agregar marca nueva
export const addBrand = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    const { brand_name, store_id } = req.body;
    
    if (!brand_name || !store_id) {
      console.log('Missing required fields:', { brand_name, store_id });
      return res.status(400).json({ 
        message: 'El nombre y la tienda son obligatorios',
        received: { brand_name, store_id }
      });
    }

    // Verificar si ya existe la marca en la misma tienda
    try {
      const exists = await pool.query(
        'SELECT * FROM marcas WHERE LOWER(brand_name) = LOWER($1) AND store_id = $2',
        [brand_name, store_id]
      );
      
      if (exists.rows.length > 0) {
        console.log('Brand already exists:', { brand_name, store_id });
        return res.status(409).json({ 
          message: 'Ya existe una marca con este nombre en la tienda seleccionada',
          existing: exists.rows[0]
        });
      }
    } catch (queryError) {
      console.error('Error checking for existing brand:', queryError);
      return res.status(500).json({ 
        message: 'Error al verificar marca existente',
        error: queryError.message,
        query: 'SELECT * FROM marcas WHERE LOWER(brand_name) = LOWER($1) AND store_id = $2',
        params: [brand_name, store_id]
      });
    }

    // Insertar la nueva marca
    try {
      const result = await pool.query(
        'INSERT INTO marcas (brand_name, store_id) VALUES ($1, $2) RETURNING *',
        [brand_name, store_id]
      );
      
      if (!result.rows[0]) {
        console.error('No rows returned after insert');
        return res.status(500).json({ 
          message: 'No se pudo crear la marca',
          details: 'La inserción no devolvió ningún resultado'
        });
      }
      
      console.log('Brand created successfully:', result.rows[0]);
      return res.status(201).json(result.rows[0]);
      
    } catch (insertError) {
      console.error('Error inserting brand:', insertError);
      return res.status(500).json({ 
        message: 'Error al insertar la marca en la base de datos',
        error: insertError.message,
        query: 'INSERT INTO marcas (brand_name, store_id) VALUES ($1, $2) RETURNING *',
        params: [brand_name, store_id]
      });
    }
    
  } catch (error) {
    console.error('Unexpected error in addBrand:', error);
    return res.status(500).json({ 
      message: 'Error inesperado al procesar la solicitud',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Obtener marcas por tienda
export const getBrandsByStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    const result = await pool.query(
      'SELECT brand_id, brand_name FROM marcas WHERE store_id = $1 ORDER BY brand_name',
      [storeId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener marcas por tienda:', error);
    res.status(500).json({ message: 'Error al obtener las marcas', error: error.message });
  }
};