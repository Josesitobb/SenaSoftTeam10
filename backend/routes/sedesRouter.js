import express from 'express';
import { getSede } from '../controllers/sedesController.js';


const router = express.Router();

router.get('/', getSede);


export default router;