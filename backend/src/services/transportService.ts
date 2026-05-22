/**
 * Swiss public transport departures using transport.opendata.ch
 * Documentation: https://transport.opendata.ch/docs.html
 * — completely free, no API key required.
 */
import axios from 'axios';
import { config } from '../config';
import { getEffectiveConfig } from './settingsService';
import { getCache, withCache } from './cache';
import { logger } from '../logger';

const BASE_URL = 'https://transport.opendata.ch/v1';

export interface Departure {
  departure: string;           // ISO timestamp
  delay: number | null;        // minutes
  platform: string | null;
  destination: string;
  trainType: string;           // e.g. "IC", "IR", "S", "RE"
  trainNumber: string;
  cancelled: boolean;
  realtimeDeparture: string | null;
}

export interface CommuteLeg {
  name: string;
  category: string;
  departure: string;
  arrival: string;
  departurePlatform: string | null;
  arrivalPlatform: string | null;
}

export interface CommuteConnection {
  departure: string;
  arrival: string;
  duration: string;
  durationMinutes: number | null;
  transfers: number;
  fromPlatform: string | null;
  toPlatform: string | null;
  products: string[];
  legs: CommuteLeg[];
}

export interface CommuteWindow {
  label: 'outbound' | 'return';
  from: string;
  to: string;
  date: string;
  targetTime: string;
  options: CommuteConnection[];
  error?: string;
}

export interface CommuteData {
  from: string;
  to: string;
  departureTime: string;
  returnTime: string;
  outbound: CommuteWindow;
  inbound: CommuteWindow;
  fetchedAt: string;
}

export interface TransportData {
  stationName: string;
  stationId: string;
  departures: Departure[];
  commute: CommuteData | null;
  fetchedAt: string;
}

const cache = getCache('transport', config.transport.refreshSeconds);

function normaliseTime(value: string, fallback: string): string {
  return /^\d{2}:\d{2}$/.test(value) ? value : fallback;
}

function zonedDateParts() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: config.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());

  const byType = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return {
    date: `${byType.year}-${byType.month}-${byType.day}`,
    minutes: parseInt(byType.hour, 10) * 60 + parseInt(byType.minute, 10),
  };
}

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}

function serviceDateForTime(time: string): string {
  const { date, minutes } = zonedDateParts();
  const [hours, mins] = time.split(':').map(Number);
  const targetMinutes = hours * 60 + mins;
  return minutes > targetMinutes + config.commute.windowMinutes
    ? addDays(date, 1)
    : date;
}

function parseDurationMinutes(duration: string): number | null {
  const match = duration.match(/(?:(\d+)d)?(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  const days = parseInt(match[1] ?? '0', 10);
  const hours = parseInt(match[2], 10);
  const minutes = parseInt(match[3], 10);
  return days * 24 * 60 + hours * 60 + minutes;
}

function lineName(journey: any): string {
  const category = String(journey?.category ?? '').trim();
  const number = String(journey?.number ?? '').trim();
  if (category && number && number.length <= 3) return `${category} ${number}`;
  if (category) return category;
  return String(journey?.name ?? 'Train');
}

function mapConnection(connection: any): CommuteConnection {
  const sections = Array.isArray(connection.sections) ? connection.sections : [];
  const legs: CommuteLeg[] = sections
    .filter((section: any) => section?.journey)
    .map((section: any) => ({
      name: lineName(section.journey),
      category: String(section.journey?.category ?? ''),
      departure: section.departure?.departure ?? '',
      arrival: section.arrival?.arrival ?? '',
      departurePlatform: section.departure?.platform ?? null,
      arrivalPlatform: section.arrival?.platform ?? null,
    }));

  const products = Array.isArray(connection.products)
    ? connection.products.filter(Boolean).map(String)
    : legs.map((leg) => leg.name);

  return {
    departure: connection.from?.departure ?? '',
    arrival: connection.to?.arrival ?? '',
    duration: connection.duration ?? '',
    durationMinutes: parseDurationMinutes(connection.duration ?? ''),
    transfers: connection.transfers ?? Math.max(0, legs.length - 1),
    fromPlatform: connection.from?.platform ?? null,
    toPlatform: connection.to?.platform ?? null,
    products,
    legs,
  };
}

function failedWindow(
  label: 'outbound' | 'return',
  from: string,
  to: string,
  time: string,
  err: unknown,
): CommuteWindow {
  return {
    label,
    from,
    to,
    date: serviceDateForTime(time),
    targetTime: time,
    options: [],
    error: String(err),
  };
}

async function fetchCommuteWindow(
  label: 'outbound' | 'return',
  from: string,
  to: string,
  time: string,
): Promise<CommuteWindow> {
  const date = serviceDateForTime(time);
  const { data } = await axios.get(`${BASE_URL}/connections`, {
    params: {
      from,
      to,
      date,
      time,
      limit: config.commute.maxOptions,
    },
    timeout: 10000,
  });

  const options = (data.connections ?? []).map(mapConnection);
  return {
    label,
    from: data.from?.name ?? from,
    to: data.to?.name ?? to,
    date,
    targetTime: time,
    options,
  };
}

async function fetchCommuteData(): Promise<CommuteData | null> {
  const cfg = getEffectiveConfig();
  const from = (config.commute.fromStation || cfg.stationName).trim();
  const to = (cfg.commuteToStation || config.commute.toStation).trim();

  if (!config.commute.enabled || !from || !to) return null;

  const departureTime = normaliseTime(config.commute.departureTime, '07:30');
  const returnTime = normaliseTime(config.commute.returnTime, '17:30');

  logger.info(`Fetching commute options: ${from} -> ${to}`);

  const [outboundResult, inboundResult] = await Promise.allSettled([
    fetchCommuteWindow('outbound', from, to, departureTime),
    fetchCommuteWindow('return', to, from, returnTime),
  ]);

  const outbound = outboundResult.status === 'fulfilled'
    ? outboundResult.value
    : failedWindow('outbound', from, to, departureTime, outboundResult.reason);

  const inbound = inboundResult.status === 'fulfilled'
    ? inboundResult.value
    : failedWindow('return', to, from, returnTime, inboundResult.reason);

  if (outboundResult.status === 'rejected') logger.warn(`Outbound commute fetch failed: ${outboundResult.reason}`);
  if (inboundResult.status === 'rejected') logger.warn(`Return commute fetch failed: ${inboundResult.reason}`);

  return {
    from,
    to,
    departureTime,
    returnTime,
    outbound,
    inbound,
    fetchedAt: new Date().toISOString(),
  };
}

export async function fetchDepartures(): Promise<TransportData> {
  const cfg = getEffectiveConfig();
  const stationName = cfg.stationName;
  return withCache(cache, `departures-${stationName}`, async () => {
    logger.info(`Fetching departures for station: ${stationName}`);

    // Step 1: resolve station ID
    const stationRes = await axios.get(`${BASE_URL}/locations`, {
      params: { query: stationName, type: 'station' },
      timeout: 10000,
    });

    const stations = stationRes.data?.stations;
    if (!stations || stations.length === 0) {
      throw new Error(`Station not found: ${stationName}`);
    }

    const station = stations[0];
    const stationId: string = station.id;
    const stationName: string = station.name;

    // Step 2: fetch stationboard
    const boardRes = await axios.get(`${BASE_URL}/stationboard`, {
      params: {
        id: stationId,
        limit: 20,
        show_delays: 1,
      },
      timeout: 10000,
    });

    const stationboard = boardRes.data?.stationboard ?? [];

    const departures: Departure[] = stationboard.map((entry: any) => {
      const stop = entry.stop ?? {};
      const departure = stop.departure ?? null;
      const realtimeDeparture = stop.prognosis?.departure ?? null;

      let delay: number | null = null;
      if (departure && realtimeDeparture) {
        const planned = new Date(departure).getTime();
        const realtime = new Date(realtimeDeparture).getTime();
        delay = Math.round((realtime - planned) / 60000);
      }

      const category: string = entry.category ?? '';
      const number: string = entry.number ?? '';

      return {
        departure: departure ?? '',
        realtimeDeparture,
        delay,
        platform: stop.platform ?? null,
        destination: entry.to ?? '',
        trainType: category,
        trainNumber: `${category}${number}`.trim(),
        cancelled: stop.prognosis?.departure === null && stop.prognosis !== null,
      };
    });

    return {
      stationName,
      stationId,
      departures,
      commute: await fetchCommuteData(),
      fetchedAt: new Date().toISOString(),
    };
  });
}
