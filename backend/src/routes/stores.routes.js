import express from 'express';
import { 
  listarComercios, 
  listarComerciosPorRegion, 
  obtenerComercioPorId, 
  crearComercio, 
  actualizarComercio, 
  eliminarComercio 
} from '../controllers/stores.controller.js';
import { validateStore, validateStoreId } from '../middlewares/validation.js';

const router = express.Router();

// GET /api/stores - Obtener todos los comercios
router.get('/', listarComercios);

// GET /api/stores/region/:region_id - Obtener comercios por región
router.get('/region/:region_id', listarComerciosPorRegion);

// GET /api/stores/:id - Obtener comercio por ID
router.get('/:id', validateStoreId, obtenerComercioPorId);

// POST /api/stores - Crear nuevo comercio
router.post('/', validateStore, crearComercio);

// PUT /api/stores/:id - Actualizar comercio
router.put('/:id', validateStoreId, validateStore, actualizarComercio);

// DELETE /api/stores/:id - Eliminar comercio (soft delete)
router.delete('/:id', validateStoreId, eliminarComercio);

export default router;