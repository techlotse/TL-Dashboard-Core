import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { logger } from './logger';

import healthRouter      from './routes/health';
import weatherRouter     from './routes/weather';
import transportRouter   from './routes/transport';
import calendarRouter    from './routes/calendar';
import holidaysRouter    from './routes/holidays';
import rssRouter         from './routes/rss';
import backgroundsRouter from './routes/backgrounds';

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN ?? '*',
  methods: ['GET'],
}));
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// ── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/health',      healthRouter);
app.use('/api/weather',     weatherRouter);
app.use('/api/transport',   transportRouter);
app.use('/api/calendar',    calendarRouter);
app.use('/api/holidays',    holidaysRouter);
app.use('/api/rss',         rssRouter);

// Background images are served directly by nginx from the mounted folder.
// This route only handles the GET / list endpoint.
app.use('/api/backgrounds', backgroundsRouter);

// ── Config endpoint (non-sensitive) ─────────────────────────────────────────
// Exposes only the config values that the frontend needs to know.
app.get('/api/config', (_req, res) => {
  res.json({
    timezone: config.timezone,
    stationName: config.transport.stationName,
    refreshWeatherMinutes: config.weather.refreshMinutes,
    refreshTransportSeconds: config.transport.refreshSeconds,
    refreshCalendarMinutes: config.calendar.refreshMinutes,
    refreshRssMinutes: config.rss.refreshMinutes,
    holidayTown1: config.holidays.town1,
    holidayTown2: config.holidays.town2,
    backgroundIntervalSeconds: config.backgrounds.intervalSeconds,
    rssItemDurationSeconds: config.rss.itemDurationSeconds,
    holidaysMaxItems: config.holidays.maxItems,
    calendarDisplayDays: config.calendar.displayDays,
  });
});

// ── Serve frontend in production ─────────────────────────────────────────────
// When built, the frontend dist is copied to /app/frontend/dist inside the container.
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (process.env.SERVE_FRONTEND === 'true') {
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// ── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(`Unhandled error: ${err.message}`, err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(config.port, () => {
  logger.info(`TL-Dashboard API listening on port ${config.port} (${config.nodeEnv})`);
  logger.info(`Timezone: ${config.timezone}`);
  logger.info(`Station: ${config.transport.stationName}`);
});

export default app;
