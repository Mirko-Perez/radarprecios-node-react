import express from 'express';
import multer from 'multer';
import { 
  getProductsByRegion, 
  addProduct, 
  getAllProducts, 
  updateProductStatus,
  getProductsByBrand 
} from '../controllers/productsController.js';

const router = express.Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'src/images'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Obtener todos los productos con sus relaciones
router.get('/', getAllProducts);

// Obtener productos por región
router.get('/region/:region_id', getProductsByRegion);

// Obtener productos por marca
router.get('/brand/:brand_id', getProductsByBrand);

// Actualizar estado de un producto (y sus precios)
router.put('/:product_id/status', updateProductStatus);

// Agregar nuevo producto
router.post('/', upload.single('imagen'), addProduct);

export default router;