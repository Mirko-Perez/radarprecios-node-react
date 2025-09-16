import express from 'express';
import { getOverviewByRegion } from '../controllers/overview.controller.js';

const router = express.Router();
router.get('/:region_id', getOverviewByRegion);

export default router;
