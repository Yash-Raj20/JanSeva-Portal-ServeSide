// routes/contactRoutes.js
import express from 'express';
const router = express.Router();
import { sendContactMessage } from '../controllers/ContactController/contactController.js';


router.post('/contact', sendContactMessage);

export default router;