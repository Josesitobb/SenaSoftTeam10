import express from 'express';
import { getRoles } from '../controllers/rolesController.js';

const router = express.Router();

router.get('/', getRoles);

export default router;
