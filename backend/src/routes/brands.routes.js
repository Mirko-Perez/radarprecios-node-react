import express from 'express';
import { 
  getAllBrands, 
  getBrandById, 
  getBrandsByStore, 
  createBrand, 
  updateBrand, 
  deleteBrand, 
  getBrandPriceStats 
} from '../controllers/brands.controller.js';
import { validateBrand, validateBrandId } from '../middlewares/validation.js';

const router = express.Router();

// GET /api/brands - Obtener todas las marcas
router.get('/', getAllBrands);

// GET /api/brands/store/:store_id - Obtener marcas por tienda
router.get('/store/:store_id', getBrandsByStore);

// GET /api/brands/:id/price-stats - Obtener estadísticas de precios de una marca
router.get('/:id/price-stats', validateBrandId, getBrandPriceStats);

// GET /api/brands/:id - Obtener marca por ID
router.get('/:id', validateBrandId, getBrandById);

// POST /api/brands - Crear nueva marca
router.post('/', validateBrand, createBrand);

// PUT /api/brands/:id - Actualizar marca
router.put('/:id', validateBrandId, validateBrand, updateBrand);

// DELETE /api/brands/:id - Eliminar marca
router.delete('/:id', validateBrandId, deleteBrand);

export default router;
