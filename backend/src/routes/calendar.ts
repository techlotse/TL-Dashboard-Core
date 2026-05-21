import { Router, Request, Response } from 'express';
import { fetchCalendarEvents } from '../services/calendarService';
import { logger } from '../logger';

const router = Router();

// GET /api/calendar
router.get('/', async (_req: Request, res: Response) => {
  try {
    const data = await fetchCalendarEvents();
    res.json(data);
  } catch (err) {
    logger.error(`Calendar route error: ${err}`);
    res.status(502).json({ error: 'Failed to fetch calendar data', detail: String(err) });
  }
});

export default router;
