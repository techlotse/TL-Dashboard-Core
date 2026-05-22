import { Router, Request, Response } from 'express';
import { fetchMetar } from '../services/metarService';
import { getEffectiveConfig } from '../services/settingsService';
import { logger } from '../logger';

const router = Router();

/** GET /api/metar — fetch decoded METAR for the configured (or query-param) ICAO */
router.get('/', async (req: Request, res: Response) => {
  const icao = (req.query.icao as string) || getEffectiveConfig().metarIcao;
  try {
    const data = await fetchMetar(icao);
    res.json(data);
  } catch (err) {
    logger.error(`METAR route error for ${icao}: ${err}`);
    res.status(502).json({ error: `Failed to fetch METAR for ${icao}`, detail: String(err) });
  }
});

export default router;
