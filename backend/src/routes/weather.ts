import { Router, Request, Response } from 'express';
import { fetchWeather } from '../services/weatherService';
import { logger } from '../logger';

const router = Router();

// GET /api/weather
router.get('/', async (_req: Request, res: Response) => {
  try {
    const data = await fetchWeather();
    res.json(data);
  } catch (err) {
    logger.error(`Weather route error: ${err}`);
    res.status(502).json({ error: 'Failed to fetch weather data', detail: String(err) });
  }
});

export default router;
