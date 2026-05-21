import { Router, Request, Response } from 'express';
import { fetchHolidays } from '../services/holidayService';
import { logger } from '../logger';

const router = Router();

// GET /api/holidays
router.get('/', async (_req: Request, res: Response) => {
  try {
    const data = await fetchHolidays();
    res.json(data);
  } catch (err) {
    logger.error(`Holidays route error: ${err}`);
    res.status(502).json({ error: 'Failed to fetch holiday data', detail: String(err) });
  }
});

export default router;
