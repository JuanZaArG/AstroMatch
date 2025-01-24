import express from 'express';
import { calculateChart } from '../controllers/astrologyController.js';
import { sendToGoogleSheet } from '../controllers/googleSheetController.js'; 

const router = express.Router();

// Rutas existentes
router.post('/chart', calculateChart);

// Nueva ruta para enviar datos al Google Sheet
router.post('/send-to-google-sheet', sendToGoogleSheet);

export default router;
