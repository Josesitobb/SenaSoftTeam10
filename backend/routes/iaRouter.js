import express from 'express';
import { startConversation, postMessage } from '../controllers/iaController.js';

const router = express.Router();

// Iniciar conversación
router.get('/', startConversation);

// Enviar mensaje / guardar documento
router.post('/:sessionId', postMessage);

export default router;
