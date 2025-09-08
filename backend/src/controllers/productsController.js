import pool from '../config/db.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

export const getAllProducts = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.*,
        b.brand_name,
        r.region_name,
        g.group_name
      FROM productos p
      JOIN marcas b ON p.brand_id = b.brand_id
      JOIN regiones r ON p.region_id = r.region_id
      JOIN grupos g ON p.group_id = g.group_id
      ORDER BY p.product_name
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos', error: error.message });
  }
};

export const updateProductStatus = async (req, res) => {
  const { product_id } = req.params;
  let { is_valid } = req.body;
  
  // Asegurarse de que product_id sea un número
  const productId = parseInt(product_id, 10);
  if (isNaN(productId)) {
    return res.status(400).json({ message: 'ID de producto no válido' });
  }
  
  // Asegurarse de que is_valid sea un booleano (1 o 0 para PostgreSQL)
  const isValidBool = is_valid === true || is_valid === 'true' || is_valid === 1 || is_valid === '1';
  const isValidInt = isValidBool ? 1 : 0;
  
  // Iniciar transacción
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Actualizar estado del producto
    const updateProduct = await client.query(
      'UPDATE productos SET is_valid = $1 WHERE product_id = $2 RETURNING *',
      [isValidInt, productId]
    );
    
    if (updateProduct.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    // 2. Actualizar estado de los precios asociados
    const updatePrices = await client.query(
      'UPDATE precios SET is_valid = $1 WHERE product_id = $2 RETURNING *',
      [isValidInt, productId]
    );
    
    await client.query('COMMIT');
    
    res.json({ 
      success: true,
      message: 'Producto y precios actualizados correctamente',
      data: {
        product: updateProduct.rows[0],
        prices_updated: updatePrices.rowCount
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar el producto',
      error: {
        message: error.message,
        code: error.code,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      }
    });
  } finally {
    client.release();
  }
};

// Configuración de multer para nombre único
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../images'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
    cb(null, uniqueName);
  }
});
export const upload = multer({ storage });

// Obtener productos por región con información detallada
export const getProductsByRegion = async (req, res) => {
  const { region_id } = req.params;
  try {
    const query = `
      SELECT 
        p.*,
        b.brand_name,
        g.group_name,
        r.region_name,
        (
          SELECT AVG(price_amount) 
          FROM precios 
          WHERE product_id = p.product_id 
          AND is_valid = 1 
          AND is_current = true
        ) as average_price,
        (
          SELECT store_name 
          FROM precios pr 
          JOIN comercios c ON pr.store_id = c.store_id 
          WHERE pr.product_id = p.product_id 
          AND pr.is_current = true 
          ORDER BY pr.price_amount DESC 
          LIMIT 1
        ) as most_expensive_store,
        (
          SELECT price_amount 
          FROM precios 
          WHERE product_id = p.product_id 
          AND is_current = true 
          ORDER BY price_amount DESC 
          LIMIT 1
        ) as highest_price,
        (
          SELECT price_amount 
          FROM precios 
          WHERE product_id = p.product_id 
          AND is_current = true 
          ORDER BY price_amount ASC 
          LIMIT 1
        ) as lowest_price
      FROM productos p
      LEFT JOIN marcas b ON p.brand_id = b.brand_id
      LEFT JOIN grupos g ON p.group_id = g.group_id
      LEFT JOIN regiones r ON p.region_id = r.region_id
      WHERE ($1 = 'all'::text OR p.region_id::text = $1::text)
      AND p.is_valid = 1
      ORDER BY g.group_name, p.product_name
    `;
    
    const result = await pool.query(query, [region_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in getProductsByRegion:', error);
    res.status(500).json({ 
      message: 'Error al obtener productos', 
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

// Obtener productos por marca
export const getProductsByBrand = async (req, res) => {
  const { brand_id } = req.params;
  try {
    const query = `
      SELECT p.*, b.brand_name 
      FROM productos p
      JOIN marcas b ON p.brand_id = b.brand_id
      WHERE p.brand_id = $1
      AND p.is_valid = 1
      ORDER BY p.product_name
    `;
    const result = await pool.query(query, [brand_id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos por marca', error: error.message });
  }
};

// Agregar producto nuevo
export const addProduct = async (req, res) => {
  try {
    const { product_name, brand_id, group_id, region_id } = req.body;
    

    
    // Validar que todos los campos requeridos estén presentes
    const missingFields = [];
    if (!product_name) missingFields.push('product_name');
    if (!brand_id) missingFields.push('brand_id');
    if (!group_id) missingFields.push('group_id');
    if (!region_id) missingFields.push('region_id');
    
    if (missingFields.length > 0) {
  
      return res.status(400).json({ 
        message: 'Faltan campos obligatorios', 
        missingFields 
      });
    }
    let imagen = null;
    if (req.file) {
      imagen = `/images/${req.file.filename}`;
    }
    if (!product_name || !brand_id || !group_id || !region_id) {
      return res.status(400).json({ message: 'Faltan datos' });
    }
    // Si no se subió imagen, intenta reutilizar la de un producto existente con mismo nombre
    if (!imagen) {
      const existingImg = await pool.query(
        'SELECT imagen FROM productos WHERE region_id = $1 AND LOWER(product_name) = LOWER($2) AND imagen IS NOT NULL LIMIT 1',
        [region_id, product_name]
      );
      if (existingImg.rows.length > 0) {
        imagen = existingImg.rows[0].imagen;
      }
    }
    // Verificar duplicado exacto para misma marca en la misma región
    const dup = await pool.query(
      'SELECT * FROM productos WHERE region_id = $1 AND brand_id = $2 AND LOWER(product_name) = LOWER($3)',
      [region_id, brand_id, product_name]
    );
    if (dup.rows.length > 0) {
      // Buscar productos similares para mostrar como sugerencias
      const similares = await pool.query(
        'SELECT * FROM productos WHERE region_id = $1 AND LOWER(product_name) LIKE LOWER($2) LIMIT 5',
        [region_id, `%${product_name}%`]
      );
      return res.status(409).json({ 
        message: 'Ya existe un producto con ese nombre para la misma marca en esta región',
        similares: similares.rows
      });
    }
    // Buscar similares opcionalmente para feedback
    const similares = await pool.query(
      'SELECT * FROM productos WHERE region_id = $1 AND LOWER(product_name) LIKE LOWER($2)',
      [region_id, `%${product_name}%`]
    );
    const result = await pool.query(
      'INSERT INTO productos (product_name, brand_id, group_id, region_id, imagen) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [product_name, brand_id, group_id, region_id, imagen]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
res.status(500).json({ 
      message: 'Error al agregar producto', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};