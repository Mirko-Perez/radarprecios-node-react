import express from 'express';
import { getOverviewByRegion } from '../controllers/overviewController.js';

const router = express.Router();
router.get('/:region_id', getOverviewByRegion);

export default router;