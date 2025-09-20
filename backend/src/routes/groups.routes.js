import express from 'express';
import { 
  getAllGroups, 
  getGroupById, 
  createGroup, 
  updateGroup, 
  deleteGroup 
} from '../controllers/groups.controller.js';
import { validateGroup, validateGroupId } from '../middlewares/validation.js';

const router = express.Router();

// GET /api/groups - Obtener todos los grupos
router.get('/', getAllGroups);

// GET /api/groups/:id - Obtener grupo por ID
router.get('/:id', validateGroupId, getGroupById);

// POST /api/groups - Crear nuevo grupo
router.post('/', validateGroup, createGroup);

// PUT /api/groups/:id - Actualizar grupo
router.put('/:id', validateGroupId, validateGroup, updateGroup);

// DELETE /api/groups/:id - Eliminar grupo
router.delete('/:id', validateGroupId, deleteGroup);

export default router;
