import pool from '../config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Listar productos por marca y región
export const getProductsByBrandAndRegion = async (req, res) => {
  const { brand_id, region_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM productos WHERE brand_id = $1 AND region_id = $2 ORDER BY product_name`,
      [brand_id, region_id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos', error: error.message });
  }
};

// Listar comercios por región
export const getStoresByRegion = async (req, res) => {
  const { region_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM comercios WHERE region_id = $1 ORDER BY store_name`,
      [region_id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener comercios', error: error.message });
  }
};



// Get price averages by region with product details
export const getPriceAveragesByRegion = async (req, res) => {
  const { region_id } = req.query;
  if (!region_id) {
    return res.status(400).json({ message: 'Region ID is required' });
  }

  try {
    const result = await pool.query(
      `
      SELECT 
        g.group_id,
        g.group_name,
        p.product_id,
        p.product_name,
        r.region_id,
        r.region_name,
        COALESCE(ROUND(AVG(CASE WHEN pr.is_valid = 1 AND pr.is_current = true THEN pr.price_amount END)::numeric, 2), 0) as average_price,
        COUNT(DISTINCT CASE WHEN pr.is_valid = 1 AND pr.is_current = true THEN pr.store_id END) as store_count
      FROM productos p
      JOIN grupos g ON p.group_id = g.group_id
      JOIN regiones r ON p.region_id = r.region_id
      LEFT JOIN precios pr ON p.product_id = pr.product_id
      WHERE p.region_id = $1
      GROUP BY g.group_id, g.group_name, p.product_id, p.product_name, r.region_id, r.region_name
      ORDER BY g.group_name, p.product_name
      `, [region_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error in getPriceAveragesByRegion:', error);
    res.status(500).json({ 
      message: 'Error al obtener promedios de precios', 
      error: error.message,
      details: error.detail || error.stack 
    });
  }
};

export const getPriceTrend = async (req, res) => {
  const { region_id, time_range } = req.query;
  if (!region_id) {
    return res.status(400).json({ message: 'Region ID is required' });
  }

  const timeRanges = {
    '7days': '7 days',
    '30days': '30 days',
    '90days': '90 days',
    'year': '1 year'
  };
  const timeRangeQuery = timeRanges[time_range] || '7 days';

  try {
    const result = await pool.query(
      `
      SELECT 
        DATE_TRUNC('day', pr.date_recorded) as date,
        AVG(pr.price_amount) as average_price
      FROM precios pr
      JOIN productos p ON pr.product_id = p.product_id
      WHERE p.region_id = $1
        AND pr.date_recorded >= NOW() - INTERVAL '${timeRangeQuery}'
        AND pr.is_valid = 1
      GROUP BY DATE_TRUNC('day', pr.date_recorded)
      ORDER BY date
      `, [region_id]
    );

    if (result.rows.length === 0) {
      return res.json({
        labels: [],
        data: []
      });
    }

    const labels = result.rows.map(row => row.date.toISOString().split('T')[0]);
    const data = result.rows.map(row => parseFloat(row.average_price).toFixed(2));

    res.json({
      labels,
      data
    });
  } catch (error) {
    console.error('Error in getPriceTrend:', error);
    res.status(500).json({ 
      message: 'Error al obtener tendencia de precios', 
      error: error.message,
      details: error.detail || error.stack 
    });
  }
}; 

export const getMostExpensiveProducts = async (req, res) => {
  const { region_id, limit = 10 } = req.query;
  
  if (!region_id) {
    return res.status(400).json({ message: 'Region ID is required' });
  }

  try {
    const result = await pool.query(
      `
      SELECT 
        p.product_name,
        pr.price_amount as price,
        s.store_name,
        g.group_name,
        p.group_id
      FROM precios pr
      JOIN productos p ON pr.product_id = p.product_id
      JOIN comercios s ON pr.store_id = s.store_id
      JOIN grupos g ON p.group_id = g.group_id
      WHERE p.region_id = $1
        AND pr.is_valid = 1
        AND pr.is_current = true
      ORDER BY pr.price_amount DESC
      LIMIT $2
      `,
      [region_id, limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error in getMostExpensiveProducts:', error);
    res.status(500).json({ 
      message: 'Error al obtener productos más caros', 
      error: error.message,
      details: error.detail || error.stack 
    });
  }
};

export const getCheapestProducts = async (req, res) => {
  const { region_id, limit = 10 } = req.query;
  
  if (!region_id) {
    return res.status(400).json({ message: 'Region ID is required' });
  }

  try {
    const result = await pool.query(
      `
      SELECT 
        p.product_name,
        pr.price_amount as price,
        s.store_name,
        g.group_name,
        p.group_id
      FROM precios pr
      JOIN productos p ON pr.product_id = p.product_id
      JOIN comercios s ON pr.store_id = s.store_id
      JOIN grupos g ON p.group_id = g.group_id
      WHERE p.region_id = $1
        AND pr.is_valid = 1
        AND pr.is_current = true
      ORDER BY pr.price_amount ASC
      LIMIT $2
      `,
      [region_id, limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error in getCheapestProducts:', error);
    res.status(500).json({ 
      message: 'Error al obtener productos más baratos', 
      error: error.message,
      details: error.detail || error.stack 
    });
  }
};

export const getMostExpensiveBrands = async (req, res) => {
  const { region_id, limit = 3 } = req.query;
  if (!region_id) {
    return res.status(400).json({ message: 'Region ID is required' });
  }

  try {
    const result = await pool.query(
      `
      SELECT 
        b.brand_name,
        AVG(pr.price_amount) as average_price
      FROM precios pr
      JOIN productos p ON pr.product_id = p.product_id
      JOIN marcas b ON p.brand_id = b.brand_id
      WHERE p.region_id = $1
        AND pr.is_valid = 1
        AND pr.is_current = true
      GROUP BY b.brand_name
      ORDER BY average_price DESC
      LIMIT $2
      `, [region_id, limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error in getMostExpensiveBrands:', error);
    res.status(500).json({ 
      message: 'Error al obtener marcas más caras', 
      error: error.message,
      details: error.detail || error.stack 
    });
  }
};

export const getCheapestBrands = async (req, res) => {
  const { region_id, limit = 3 } = req.query;
  if (!region_id) {
    return res.status(400).json({ message: 'Region ID is required' });
  }

  try {
    const result = await pool.query(
      `
      SELECT 
        b.brand_name,
        AVG(pr.price_amount) as average_price
      FROM precios pr
      JOIN productos p ON pr.product_id = p.product_id
      JOIN marcas b ON p.brand_id = b.brand_id
      WHERE p.region_id = $1
        AND pr.is_valid = 1
        AND pr.is_current = true
      GROUP BY b.brand_name
      ORDER BY average_price ASC
      LIMIT $2
      `, [region_id, limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error in getCheapestBrands:', error);
    res.status(500).json({ 
      message: 'Error al obtener marcas más baratas', 
      error: error.message,
      details: error.detail || error.stack 
    });
  }
};

export const getPriceStatistics = async (req, res) => {
  const { region_id } = req.query;
  if (!region_id) {
    return res.status(400).json({ message: 'Region ID is required' });
  }

  try {
    // Get total monitored products
    const monitoredResult = await pool.query(
      `
      SELECT COUNT(DISTINCT pr.product_id) as monitored_products
      FROM precios pr
      JOIN productos p ON pr.product_id = p.product_id
      WHERE p.region_id = $1
        AND pr.is_valid = 1
        AND pr.is_current = true
      `, [region_id]
    );

    // Get average price
    const avgResult = await pool.query(
      `
      SELECT AVG(pr.price_amount) as average_price
      FROM precios pr
      JOIN productos p ON pr.product_id = p.product_id
      WHERE p.region_id = $1
        AND pr.is_valid = 1
        AND pr.is_current = true
      `, [region_id]
    );

    // Get monthly variation
    const variationResult = await pool.query(
      `
      SELECT 
        (AVG(CASE 
          WHEN pr.date_recorded >= NOW() - INTERVAL '1 month' THEN pr.price_amount
          ELSE NULL
        END) - 
        AVG(CASE 
          WHEN pr.date_recorded < NOW() - INTERVAL '1 month' 
          AND pr.date_recorded >= NOW() - INTERVAL '2 months' THEN pr.price_amount
          ELSE NULL
        END)) / 
        AVG(CASE 
          WHEN pr.date_recorded < NOW() - INTERVAL '1 month' 
          AND pr.date_recorded >= NOW() - INTERVAL '2 months' THEN pr.price_amount
          ELSE NULL
        END) * 100 as monthly_variation
      FROM precios pr
      JOIN productos p ON pr.product_id = p.product_id
      WHERE p.region_id = $1
        AND pr.is_valid = 1
        AND pr.is_current = true
      `, [region_id]
    );

    res.json({
      monitored_products: monitoredResult.rows[0].monitored_products,
      average_price: parseFloat(avgResult.rows[0].average_price).toFixed(2),
      monthly_variation: parseFloat(variationResult.rows[0].monthly_variation).toFixed(2)
    });
  } catch (error) {
    console.error('Error in getPriceStatistics:', error);
    res.status(500).json({ 
      message: 'Error al obtener estadísticas de precios', 
      error: error.message,
      details: error.detail || error.stack 
    });
  }
};

// Get average prices by region
// Get average prices by product and group
export const getAveragePricesByProductAndGroup = async (req, res) => {
  const { region_id } = req.query;
  
  try {
    const query = `
      SELECT 
        p.product_id,
        p.product_name,
        g.group_id,
        g.group_name,
        ROUND(AVG(pr.price_amount)::numeric, 2) as average_price,
        COUNT(DISTINCT pr.store_id) as store_count
      FROM 
        productos p
      JOIN 
        grupos g ON p.group_id = g.group_id
      JOIN 
        precios pr ON p.product_id = pr.product_id
      WHERE 
        pr.is_current = true
        ${region_id ? 'AND p.region_id = $1' : ''}
      GROUP BY 
        p.product_id, p.product_name, g.group_id, g.group_name
      ORDER BY 
        p.product_name, g.group_name`;

    const params = region_id ? [region_id] : [];
    const result = await pool.query(query, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting average prices by product and group:', error);
    res.status(500).json({ 
      message: 'Error al obtener los precios promedio por producto y grupo', 
      error: error.message 
    });
  }
};

// Get average prices by region
export const getAveragePricesByRegion = async (req, res) => {
  const { time_range } = req.query;
  
  try {
    // Define the date range based on the time_range parameter
    let dateCondition = '';
    let params = [];
    const now = new Date();
    
    if (time_range === '7days') {
      const date = new Date();
      date.setDate(now.getDate() - 7);
      dateCondition = 'AND p.date_recorded >= $1';
      params = [date];
    } else if (time_range === '30days') {
      const date = new Date();
      date.setDate(now.getDate() - 30);
      dateCondition = 'AND p.date_recorded >= $1';
      params = [date];
    } else if (time_range === '90days') {
      const date = new Date();
      date.setDate(now.getDate() - 90);
      dateCondition = 'AND p.date_recorded >= $1';
      params = [date];
    } else if (time_range === 'year') {
      const date = new Date();
      date.setFullYear(now.getFullYear() - 1);
      dateCondition = 'AND p.date_recorded >= $1';
      params = [date];
    }

    const query = `
      SELECT 
        r.region_id,
        r.region_name,
        ROUND(AVG(p.price_amount)::numeric, 2) as average_price
      FROM 
        precios p
      JOIN 
        comercios c ON p.store_id = c.store_id
      JOIN 
        regiones r ON c.region_id = r.region_id
      WHERE 
        p.is_current = true
        ${dateCondition}
      GROUP BY 
        r.region_id, r.region_name
      ORDER BY 
        average_price DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting average prices by region:', error);
    res.status(500).json({ 
      message: 'Error al obtener los precios promedio por región', 
      error: error.message 
    });
  }
};

export const addPrice = async (req, res) => {
  const client = await pool.connect();
  let photoPath = null;

  try {
    const { product_id, store_id, price_amount, quantity } = req.body;
    const currency_id = 1;

    console.log('Request body:', req.body);
    console.log('Request file:', req.file);

    if (!product_id || !store_id || !price_amount) {
      return res.status(400).json({ 
        success: false,
        message: 'Faltan datos requeridos',
        missing: {
          product_id: !product_id,
          store_id: !store_id,
          price_amount: !price_amount
        }
      });
    }

    // Handle file upload if exists
    if (req.file) {
      try {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(req.file.originalname);
        const fileName = 'price-' + uniqueSuffix + ext;
        // Store path without /src in the database
        photoPath = '/images/' + fileName;
        // But keep the full path for file operations
        const filePathForStorage = '/src' + photoPath;

        // Move the file to the uploads directory using the full path
        const targetPath = path.join(__dirname, '../..', filePathForStorage);
        // Ensure the directory exists
        const dirPath = path.dirname(targetPath);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        fs.renameSync(req.file.path, targetPath);
      } catch (fileError) {
        console.error('Error handling file upload:', fileError);
        return res.status(500).json({
          success: false,
          message: 'Error al procesar la imagen',
          error: fileError.message
        });
      }
    }

    await client.query('BEGIN');

    // 1. Set all existing prices for this product/store to is_current = false
    await client.query(
      `UPDATE precios 
       SET is_current = false 
       WHERE product_id = $1 
       AND store_id = $2 
       AND currency_id = $3
       AND is_current = true`,
      [product_id, store_id, currency_id]
    );

    // 2. Insert the new price with is_current = true
    const result = await client.query(
      `INSERT INTO precios (
        product_id, 
        store_id, 
        currency_id, 
        price_amount, 
        quantity,
        photo, 
        date_recorded, 
        is_current
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), true) 
      RETURNING *`,
      [product_id, store_id, currency_id, price_amount, quantity || null, photoPath]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Precio guardado correctamente',
      data: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database error:', error);

    // Clean up uploaded file if there was an error
    if (photoPath) {
      const filePath = path.join(__dirname, '../..', photoPath);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (fileError) {
          console.error('Error cleaning up file:', fileError);
        }
      }
    }

    // Check if this is a unique constraint violation
    if (error.code === '23505') {
      // If it's a unique constraint violation, we need to drop the unique index
      // This is a one-time operation - you'll need to run this in your database:
      // DROP INDEX IF EXISTS precios_product_id_store_id_currency_id_is_current_idx;
      return res.status(500).json({
        success: false,
        message: 'Error: Hay un índice único que está impidiendo la creación de nuevos precios. Por favor, elimina el índice único en la base de datos.',
        error: error.message,
        code: error.code,
        solution: 'Ejecuta en tu base de datos: DROP INDEX IF EXISTS precios_product_id_store_id_currency_id_is_current_idx;'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud',
      error: error.message,
      code: error.code
    });
  } finally {
    client.release();
  }
};
