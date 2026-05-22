/**
 * METAR service — Aviation Weather Center (aviationweather.gov)
 * Free, no API key required.
 * Returns decoded METAR data for a given ICAO airport code.
 */
import axios from 'axios';
import { getCache, withCache } from './cache';
import { logger } from '../logger';

const BASE_URL = 'https://aviationweather.gov/api/data/metar';

export interface SkyLayer {
  cover: string;      // CLR, SKC, FEW, SCT, BKN, OVC, OVX
  base: number | null; // feet AGL, null for CLR/SKC
}

export interface MetarData {
  icao: string;
  rawText: string;
  obsTime: string;      // ISO string
  temp: number | null;  // °C
  dewp: number | null;  // °C
  wdir: number | null;  // degrees (null = calm or variable)
  wspd: number | null;  // knots
  wgst: number | null;  // knots, null if no gust
  visib: string;        // statute miles as string (e.g. "10+", "1/4")
  altim: number | null; // hPa
  wx: string | null;    // present weather string (e.g. "-RA", "TSRA")
  skyConditions: SkyLayer[];
  flightCategory: string; // VFR | MVFR | IFR | LIFR
  fetchedAt: string;
}

const cache = getCache('metar', 30 * 60); // default 30-min TTL

export async function fetchMetar(icao: string): Promise<MetarData> {
  const key = `metar-${icao.toUpperCase()}`;
  return withCache(cache, key, async () => {
    logger.info(`Fetching METAR for ${icao.toUpperCase()}`);

    const { data } = await axios.get(BASE_URL, {
      params: { ids: icao.toUpperCase(), format: 'json', hours: 2 },
      timeout: 10_000,
    });

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`No METAR data found for ${icao.toUpperCase()}`);
    }

    const r = data[0];

    const skyConditions: SkyLayer[] = Array.isArray(r.skyCondition)
      ? r.skyCondition.map((s: { cover?: string; base?: number }) => ({
          cover: s.cover ?? 'CLR',
          base:  s.base  ?? null,
        }))
      : [];

    // wdir: 0 may mean calm (wspd=0) or northerly; handle calm case
    const wspd = typeof r.wspd === 'number' ? r.wspd : null;
    const wdir = wspd === 0 ? null : (typeof r.wdir === 'number' ? r.wdir : null);

    // obsTime: use reportTime (UTC ISO-like string from AWC)
    const obsTime = r.reportTime
      ? new Date(r.reportTime + ' UTC').toISOString()
      : new Date().toISOString();

    return {
      icao:           r.icaoId       ?? icao.toUpperCase(),
      rawText:        r.rawOb        ?? '',
      obsTime,
      temp:           typeof r.temp  === 'number' ? r.temp  : null,
      dewp:           typeof r.dewp  === 'number' ? r.dewp  : null,
      wdir,
      wspd,
      wgst:           typeof r.wgst  === 'number' ? r.wgst  : null,
      visib:          r.visib?.toString() ?? '',
      altim:          typeof r.altim === 'number' ? Math.round(r.altim) : null,
      wx:             r.wx           ?? null,
      skyConditions,
      flightCategory: r.flightCategory ?? 'VFR',
      fetchedAt:      new Date().toISOString(),
    };
  });
}
