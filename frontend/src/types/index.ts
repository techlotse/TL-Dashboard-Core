// ── API response types ────────────────────────────────────────────────────────

export interface AppConfig {
  timezone: string;
  stationName: string;
  refreshWeatherMinutes: number;
  refreshTransportSeconds: number;
  refreshCalendarMinutes: number;
  refreshRssMinutes: number;
  holidayTown1: string;
  holidayTown2: string;
  backgroundIntervalSeconds: number;
  rssItemDurationSeconds: number;
  holidaysMaxItems: number;
  calendarDisplayDays: number;
}

// Weather
export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  weatherDescription: string;
  weatherIcon: string;
  precipitationProbability: number;
}
export interface HourlyWeather {
  time: string;
  temperature: number;
  precipitation: number;
  weatherCode: number;
  weatherDescription: string;
  weatherIcon: string;
  windSpeed: number;
  humidity: number;
}
export interface DailyWeather {
  date: string;
  temperatureMax: number;
  temperatureMin: number;
  precipitationSum: number;
  weatherCode: number;
  weatherDescription: string;
  weatherIcon: string;
  sunrise: string;
  sunset: string;
}
export interface WeatherData {
  current: CurrentWeather;
  today: HourlyWeather[];
  forecast: DailyWeather[];
  location: { lat: string; lon: string };
  fetchedAt: string;
}

// Transport
export interface Departure {
  departure: string;
  delay: number | null;
  platform: string | null;
  destination: string;
  trainType: string;
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

// Calendar
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location?: string;
  description?: string;
  color?: string;
}
export interface CalendarData {
  events: CalendarEvent[];
  calendarId: string;
  fetchedAt: string;
}

// Holidays
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

// RSS
export interface NewsItem {
  title: string;
  link: string;
  pubDate: string | null;
  source: string;
}
export interface RssData {
  items: NewsItem[];
  fetchedAt: string;
}

// Backgrounds
export interface BackgroundData {
  images: string[];
  fetchedAt: string;
}

// Generic fetch state
export type FetchState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };
