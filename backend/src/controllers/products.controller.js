import pool from '../config/db.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../images');
    if (!existsSync(uploadDir)) {
      require('fs').mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

export const upload = multer({ storage: storage });

// GET /api/products - Obtener todos los productos
export const getAllProducts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        b.brand_name,
        g.group_name,
        r.region_name
      FROM productos p
      LEFT JOIN marcas b ON p.brand_id = b.brand_id
      LEFT JOIN grupos g ON p.group_id = g.group_id
      LEFT JOIN regiones r ON p.region_id = r.region_id
      ORDER BY p.product_name
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos',
      error: error.message
    });
  }
};

// GET /api/products/:id - Obtener producto por ID
export const getProductById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        b.brand_name,
        g.group_name,
        r.region_name
      FROM productos p
      LEFT JOIN marcas b ON p.brand_id = b.brand_id
      LEFT JOIN grupos g ON p.group_id = g.group_id
      LEFT JOIN regiones r ON p.region_id = r.region_id
      WHERE p.product_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener producto',
      error: error.message
    });
  }
};

// GET /api/products/region/:region_id - Obtener productos por región
export const getProductsByRegion = async (req, res) => {
  const { region_id } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        b.brand_name,
        g.group_name,
        r.region_name
      FROM productos p
      LEFT JOIN marcas b ON p.brand_id = b.brand_id
      LEFT JOIN grupos g ON p.group_id = g.group_id
      LEFT JOIN regiones r ON p.region_id = r.region_id
      WHERE p.region_id = $1
      ORDER BY p.product_name
    `, [region_id]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener productos por región:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos por región',
      error: error.message
    });
  }
};

// GET /api/products/brand/:brand_id - Obtener productos por marca
export const getProductsByBrand = async (req, res) => {
  const { brand_id } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        b.brand_name,
        g.group_name,
        r.region_name
      FROM productos p
      LEFT JOIN marcas b ON p.brand_id = b.brand_id
      LEFT JOIN grupos g ON p.group_id = g.group_id
      LEFT JOIN regiones r ON p.region_id = r.region_id
      WHERE p.brand_id = $1
      ORDER BY p.product_name
    `, [brand_id]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener productos por marca:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos por marca',
      error: error.message
    });
  }
};

// POST /api/products - Crear nuevo producto
export const createProduct = async (req, res) => {
  try {
    const { product_name, brand_id, group_id, region_id } = req.body;
    const imagen = req.file ? req.file.filename : null;

    // Verificar si ya existe un producto con el mismo nombre, marca y región
    const existingProduct = await pool.query(
      'SELECT product_id FROM productos WHERE product_name = $1 AND brand_id = $2 AND region_id = $3',
      [product_name, brand_id, region_id]
    );

    if (existingProduct.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un producto con ese nombre, marca y región'
      });
    }

    const result = await pool.query(
      'INSERT INTO productos (product_name, brand_id, group_id, region_id, imagen, is_valid) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [product_name, brand_id, group_id, region_id, imagen, true]
    );

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear producto',
      error: error.message
    });
  }
};

// PUT /api/products/:id - Actualizar producto
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { product_name, brand_id, group_id, region_id } = req.body;
  const imagen = req.file ? req.file.filename : null;

  try {
    // Verificar si el producto existe
    const existingProduct = await pool.query(
      'SELECT product_id, imagen FROM productos WHERE product_id = $1',
      [id]
    );

    if (existingProduct.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Verificar si ya existe otro producto con el mismo nombre, marca y región
    const duplicateProduct = await pool.query(
      'SELECT product_id FROM productos WHERE product_name = $1 AND brand_id = $2 AND region_id = $3 AND product_id != $4',
      [product_name, brand_id, region_id, id]
    );

    if (duplicateProduct.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe otro producto con ese nombre, marca y región'
      });
    }

    // Si no se proporciona nueva imagen, mantener la existente
    const finalImagen = imagen || existingProduct.rows[0].imagen;

    const result = await pool.query(
      'UPDATE productos SET product_name = $1, brand_id = $2, group_id = $3, region_id = $4, imagen = $5 WHERE product_id = $6 RETURNING *',
      [product_name, brand_id, group_id, region_id, finalImagen, id]
    );

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar producto',
      error: error.message
    });
  }
};

// PATCH /api/products/:product_id/status - Actualizar estado del producto
export const updateProductStatus = async (req, res) => {
  const { product_id } = req.params;
  const { is_valid } = req.body;

  try {
    const result = await pool.query(
      'UPDATE productos SET is_valid = $1 WHERE product_id = $2 RETURNING *',
      [is_valid, product_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      message: `Producto ${is_valid ? 'activado' : 'desactivado'} exitosamente`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar estado del producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado del producto',
      error: error.message
    });
  }
};

// DELETE /api/products/:id - Eliminar producto
export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar si el producto tiene precios asociados
    const pricesCount = await pool.query(
      'SELECT COUNT(*) FROM precios WHERE product_id = $1',
      [id]
    );

    if (parseInt(pricesCount.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el producto porque tiene precios asociados'
      });
    }

    const result = await pool.query(
      'DELETE FROM productos WHERE product_id = $1 RETURNING product_name',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      message: `Producto "${result.rows[0].product_name}" eliminado exitosamente`
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto',
      error: error.message
    });
  }
};
