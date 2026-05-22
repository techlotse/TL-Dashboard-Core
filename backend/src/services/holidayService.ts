/**
 * Swiss public holidays using Nager.Date (https://date.nager.at/)
 * — free, no API key required.
 *
 * Switzerland-specific notes:
 *  - National holidays are returned for all cantons.
 *  - Cantonal-only holidays are tagged with their county codes.
 *  - Set HOLIDAY_TOWN_1 and HOLIDAY_TOWN_2 to canton codes (e.g. "ZH", "BE", "GE")
 *    to filter holidays relevant to your municipalities.
 *
 * Cantonal codes: AG, AI, AR, BE, BL, BS, FR, GE, GL, GR, JU, LU, NE,
 *                 NW, OW, SG, SH, SO, SZ, TG, TI, UR, VD, VS, ZG, ZH
 */
import axios from 'axios';
import { config } from '../config';
import { getEffectiveConfig } from './settingsService';
import { getCache, withCache } from './cache';
import { logger } from '../logger';

const BASE_URL = 'https://date.nager.at/api/v3';

export interface PublicHoliday {
  date: string;
  name: string;
  localName: string;
  isNational: boolean;
  counties: string[] | null;
  relevantTowns: string[];
}

export interface HolidayData {
  holidays: PublicHoliday[];
  year: number;
  country: string;
  fetchedAt: string;
}

const cache = getCache('holidays', 24 * 60 * 60); // cache 24h — holidays don't change

function relevantTowns(counties: string[] | null, towns: string[]): string[] {
  if (!towns.length) return [];
  if (!counties) return towns; // national holiday applies to all
  // county codes from API come as "CH-ZH", compare both formats
  const normalised = counties.map((c) => c.replace('CH-', ''));
  return towns.filter((t) => normalised.includes(t.replace('CH-', '')));
}

async function fetchYearHolidays(year: number, country: string, towns: string[]): Promise<PublicHoliday[]> {
  const { data } = await axios.get(`${BASE_URL}/PublicHolidays/${year}/${country}`, {
    timeout: 10000,
  });

  return (data as any[])
    .map((h) => ({
      date: h.date as string,
      name: h.name as string,
      localName: h.localName as string,
      isNational: h.global as boolean,
      counties: h.counties as string[] | null,
    }))
    .filter((h) => {
      // Always include national holidays
      if (h.isNational) return true;
      // If no towns configured, include everything
      if (!towns.length) return true;
      // Otherwise include only if the holiday applies to configured towns
      return relevantTowns(h.counties, towns).length > 0;
    })
    .map((h) => ({
      ...h,
      relevantTowns: relevantTowns(h.counties, towns),
    }));
}

export async function fetchHolidays(): Promise<HolidayData> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const cfg = getEffectiveConfig();
  const country = cfg.holidayCountry || config.holidays.country;
  const towns = [cfg.holidayTown1 || config.holidays.town1, cfg.holidayTown2 || config.holidays.town2].filter(Boolean);

  return withCache(cache, `holidays-${country}-${currentYear}`, async () => {
    logger.info(`Fetching public holidays for ${country} ${currentYear}`);

    let holidays = await fetchYearHolidays(currentYear, country, towns);

    // If we're in the last two months of the year, also fetch next year
    if (now.getMonth() >= 10) {
      try {
        const nextYear = await fetchYearHolidays(currentYear + 1, country, towns);
        holidays = [...holidays, ...nextYear];
      } catch (err) {
        logger.warn(`Could not prefetch next year holidays: ${err}`);
      }
    }

    // Only return holidays from today onwards, sorted
    const todayStr = now.toISOString().slice(0, 10);
    const upcoming = holidays
      .filter((h) => h.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      holidays: upcoming,
      year: currentYear,
      country,
      fetchedAt: new Date().toISOString(),
    };
  });
}
