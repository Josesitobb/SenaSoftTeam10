import express from 'express';
import { getEps } from '../controllers/epsController.js';

const router = express.Router();

router.get('/', getEps);

export default router;
