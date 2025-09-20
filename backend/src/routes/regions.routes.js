import express from 'express';
import { 
  getAllRegions, 
  getRegionById, 
  createRegion, 
  updateRegion, 
  deleteRegion 
} from '../controllers/regions.controller.js';
import { validateRegion, validateRegionId } from '../middlewares/validation.js';

const router = express.Router();

// GET /api/regions - Obtener todas las regiones
router.get('/', getAllRegions);

// GET /api/regions/:id - Obtener región por ID
router.get('/:id', validateRegionId, getRegionById);

// POST /api/regions - Crear nueva región
router.post('/', validateRegion, createRegion);

// PUT /api/regions/:id - Actualizar región
router.put('/:id', validateRegionId, validateRegion, updateRegion);

// DELETE /api/regions/:id - Eliminar región
router.delete('/:id', validateRegionId, deleteRegion);

export default router;
