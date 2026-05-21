/**
 * Background images route.
 * GET /api/backgrounds  → JSON list of image URLs
 *
 * Individual image files are served by express.static mounted in index.ts
 * BEFORE this router, so /:file requests never reach here.
 */
import { Router, Request, Response } from 'express';
import { listBackgrounds } from '../services/backgroundService';
import { logger } from '../logger';

const router = Router();

// GET /api/backgrounds
router.get('/', (_req: Request, res: Response) => {
  try {
    const data = listBackgrounds();
    res.json(data);
  } catch (err) {
    logger.error(`Backgrounds route error: ${err}`);
    res.status(500).json({ error: 'Failed to list background images' });
  }
});

export default router;
