import express from 'express';
import { getGroups } from '../controllers/groupsController.js';

const router = express.Router();

router.get('/', getGroups);

export default router;