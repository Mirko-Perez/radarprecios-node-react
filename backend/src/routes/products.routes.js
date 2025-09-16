import express from 'express';
import { 
  getAllProducts, 
  getProductById, 
  getProductsByRegion, 
  getProductsByBrand, 
  createProduct, 
  updateProduct, 
  updateProductStatus, 
  deleteProduct,
} from '../controllers/products.controller.js';
import multer from 'multer';

import { validateProduct, validateProductId, validateProductStatus } from '../middlewares/validation.js';


const router = express.Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'src/images'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// GET /api/products - Obtener todos los productos
router.get('/', getAllProducts);

// GET /api/products/region/:region_id - Obtener productos por región
router.get('/region/:region_id', getProductsByRegion);

// GET /api/products/brand/:brand_id - Obtener productos por marca
router.get('/brand/:brand_id', getProductsByBrand);

// GET /api/products/:id - Obtener producto por ID
router.get('/:id', validateProductId, getProductById);

// POST /api/products - Crear nuevo producto
router.post('/', upload.single('imagen'), validateProduct, createProduct);

// PUT /api/products/:id - Actualizar producto
router.put('/:id', validateProductId, upload.single('imagen'), validateProduct, updateProduct);

// PATCH /api/products/:product_id/status - Actualizar estado del producto
router.patch('/:product_id/status', validateProductStatus, updateProductStatus);

// DELETE /api/products/:id - Eliminar producto
router.delete('/:id', validateProductId, deleteProduct);

export default router;
