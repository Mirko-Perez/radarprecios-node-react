import express from 'express';
import { getStoresByRegion, addStore } from '../controllers/storesController.js';

const router = express.Router();

router.get('/region/:region_id', getStoresByRegion);
router.post('/', addStore);

export default router;