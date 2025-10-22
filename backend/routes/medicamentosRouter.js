import express from 'express';
import { getMedicamentos } from '../controllers/medicamentosController.js';


const router = express.Router();

router.get('/', getMedicamentos);


export default router;