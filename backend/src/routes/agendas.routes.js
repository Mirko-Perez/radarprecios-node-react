import { Router } from 'express';
import { validateJWT } from '../middlewares/validateJWT.js';
import {
  createAgenda,
  listAgendas,
  getAssignedToday,
  getAssignedWeek,
  updateAgenda,
  justifyNoExecution,
  deleteAgenda,
  bulkCreateAgendas,
} from '../controllers/agendas.controller.js';

const router = Router();

router.use(validateJWT);

// CRUD básico
router.post('/', createAgenda);
router.get('/', listAgendas);
router.put('/:id', updateAgenda);
router.put('/:id/justify', justifyNoExecution);
router.delete('/:id', deleteAgenda);

// Asignación del día para el usuario autenticado
router.get('/assigned/today', getAssignedToday);
router.get('/assigned/week', getAssignedWeek);

// Creación masiva (semanal)
router.post('/bulk', bulkCreateAgendas);

export default router;
