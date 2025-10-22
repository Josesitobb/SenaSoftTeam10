import express from 'express';
import { getEquivalencias } from '../controllers/equivalenciasController.js';

const router = express.Router();

router.get('/', getEquivalencias);

export default router;
