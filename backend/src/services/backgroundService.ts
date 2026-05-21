/**
 * Background slideshow service.
 * Scans the configured BACKGROUND_IMAGE_PATH for supported image files
 * and returns a list of relative URLs served by the /backgrounds static route.
 */
import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { logger } from '../logger';

const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

export interface BackgroundData {
  images: string[];   // URL paths like /api/backgrounds/photo.jpg
  fetchedAt: string;
}

export function listBackgrounds(): BackgroundData {
  const dir = config.backgrounds.path;

  if (!fs.existsSync(dir)) {
    logger.warn(`Background image directory not found: ${dir}`);
    return { images: [], fetchedAt: new Date().toISOString() };
  }

  let files: string[];
  try {
    files = fs.readdirSync(dir);
  } catch (err) {
    logger.error(`Cannot read background directory: ${err}`);
    return { images: [], fetchedAt: new Date().toISOString() };
  }

  const images = files
    .filter((f) => SUPPORTED_EXTENSIONS.has(path.extname(f).toLowerCase()))
    .sort()
    .map((f) => `/backgrounds/${encodeURIComponent(f)}`);

  logger.info(`Background images found: ${images.length} (dir: ${dir})`);
  return { images, fetchedAt: new Date().toISOString() };
}
