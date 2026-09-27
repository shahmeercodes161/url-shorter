// backend/routes/urlRoutes.js
import express from 'express';
import { 
  createShortUrl, 
  redirectToOriginal, 
  getAnalytics,
  toggleLinkStatus,
  deleteLink,
  getHealth
} from '../Controllers/urlController.js';

const router = express.Router();

// System and health
router.get('/health', getHealth);
router.get('/status', getHealth);

// Core Shortener APIs
router.post('/shorten', createShortUrl);
router.get('/analytics', getAnalytics);
router.patch('/links/:id/toggle', toggleLinkStatus);
router.delete('/links/:id', deleteLink);

// Short URL Redirection (must be last route)
router.get('/:code', redirectToOriginal);

export default router;