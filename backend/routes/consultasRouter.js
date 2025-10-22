import express from 'express';
import { getConsultas } from '../controllers/consultasController.js';

const router = express.Router();

router.get('/', getConsultas);

export default router;
