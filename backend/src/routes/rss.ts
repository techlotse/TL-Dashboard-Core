import { Router, Request, Response } from 'express';
import { fetchRssFeeds } from '../services/rssService';
import { logger } from '../logger';

const router = Router();

// GET /api/rss
router.get('/', async (_req: Request, res: Response) => {
  try {
    const data = await fetchRssFeeds();
    res.json(data);
  } catch (err) {
    logger.error(`RSS route error: ${err}`);
    res.status(502).json({ error: 'Failed to fetch RSS data', detail: String(err) });
  }
});

export default router;
