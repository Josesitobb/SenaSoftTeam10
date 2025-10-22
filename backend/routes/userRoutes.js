import express from 'express';
import { getUsuarios, getById } from '../controllers/userController.js';


const router = express.Router();


router.get('/', getUsuarios);

router.get('/:id', getById)

export default router;