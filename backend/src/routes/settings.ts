import { Router, Request, Response } from 'express';
import { getSettings, saveSettings, SavedSettings } from '../services/settingsService';
import { logger } from '../logger';

const router = Router();

/** GET /api/settings — return the current saved overrides (not merged defaults) */
router.get('/', (_req: Request, res: Response) => {
  res.json(getSettings());
});

/** POST /api/settings — merge and persist partial settings update */
router.post('/', (req: Request, res: Response) => {
  try {
    const partial = req.body as SavedSettings;
    saveSettings(partial);
    res.json({ ok: true });
  } catch (err) {
    logger.error(`Settings save failed: ${err}`);
    res.status(500).json({ error: 'Failed to save settings', detail: String(err) });
  }
});

export default router;
