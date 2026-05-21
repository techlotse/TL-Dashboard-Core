import { Router, Request, Response } from 'express';
import { fetchDepartures } from '../services/transportService';
import { logger } from '../logger';

const router = Router();

// GET /api/transport
router.get('/', async (_req: Request, res: Response) => {
  try {
    const data = await fetchDepartures();
    res.json(data);
  } catch (err) {
    logger.error(`Transport route error: ${err}`);
    res.status(502).json({ error: 'Failed to fetch transport data', detail: String(err) });
  }
});

export default router;
