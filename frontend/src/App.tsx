import { useEffect, useState } from 'react';
import Clock from './components/Clock';
import Weather from './components/Weather';
import Transport from './components/Transport';
import CalendarWidget from './components/CalendarWidget';
import Holidays from './components/Holidays';
import NewsTicker from './components/NewsTicker';
import Background from './components/Background';
import { useAutoRefresh } from './hooks/useAutoRefresh';
import {
  AppConfig,
  WeatherData,
  TransportData,
  CalendarData,
  HolidayData,
  RssData,
  BackgroundData,
} from './types';

// Default config — overridden once /api/config loads
const DEFAULT_CONFIG: AppConfig = {
  timezone: 'Europe/Zurich',
  stationName: 'Station',
  refreshWeatherMinutes: 30,
  refreshTransportSeconds: 60,
  refreshCalendarMinutes: 5,
  refreshRssMinutes: 10,
  holidayTown1: '',
  holidayTown2: '',
  backgroundIntervalSeconds: 15,
  rssItemDurationSeconds: 10,
  holidaysMaxItems: 8,
  calendarDisplayDays: 14,
};

const API = '/api';

export default function App() {
  const [appConfig, setAppConfig] = useState<AppConfig>(DEFAULT_CONFIG);

  // Load server config once on mount
  useEffect(() => {
    fetch(`${API}/config`)
      .then((r) => r.json())
      .then((cfg: AppConfig) => setAppConfig(cfg))
      .catch(() => {/* use defaults */});
  }, []);

  // ── Data fetches ──────────────────────────────────────────────────────────
  const weather = useAutoRefresh<WeatherData>(
    `${API}/weather`,
    appConfig.refreshWeatherMinutes * 60 * 1000,
  );

  const transport = useAutoRefresh<TransportData>(
    `${API}/transport`,
    appConfig.refreshTransportSeconds * 1000,
  );

  const calendar = useAutoRefresh<CalendarData>(
    `${API}/calendar`,
    appConfig.refreshCalendarMinutes * 60 * 1000,
  );

  const holidays = useAutoRefresh<HolidayData>(
    `${API}/holidays`,
    60 * 60 * 1000, // hourly — holidays are stable
  );

  const rss = useAutoRefresh<RssData>(
    `${API}/rss`,
    appConfig.refreshRssMinutes * 60 * 1000,
  );

  const backgrounds = useAutoRefresh<BackgroundData>(
    `${API}/backgrounds`,
    5 * 60 * 1000, // refresh list every 5 minutes
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0e1a] text-white select-none">
      {/* ── Background slideshow ─────────────────────────────────────────── */}
      <Background
        state={backgrounds}
        intervalMs={appConfig.backgroundIntervalSeconds * 1000}
      />

      {/* ── Main layout grid ─────────────────────────────────────────────── */}
      {/*
        3-column kiosk layout:
        ┌──────────┬──────────────────────┬──────────────┐
        │ Weather  │       SBB            │  22:22:ss    │
        ├──────────┤  departures/commute  ├──────────────┤
        │ Calendar │                      │  Holidays    │
        └──────────┴──────────────────────┴──────────────┘
        └──────────────────── NEWS TICKER ──────────────────────────────┘
      */}
      <div className="absolute inset-0 z-10 p-4 pb-14">
        <div className="mx-auto grid h-full min-h-0 max-w-[1480px] grid-cols-[minmax(260px,330px)_minmax(420px,560px)_minmax(300px,370px)] grid-rows-[minmax(0,1fr)] justify-center gap-3">

          {/* Left — Weather + Calendar */}
          <div className="min-h-0 min-w-0 flex flex-col gap-3">
            <div className="h-[360px] min-h-[320px]">
              <Weather state={weather} />
            </div>
            <div className="flex-1 min-h-0">
              <CalendarWidget
                state={calendar}
                displayDays={appConfig.calendarDisplayDays}
              />
            </div>
          </div>

          {/* Center — SBB board */}
          <div className="min-h-0 min-w-0 justify-self-center w-full">
            <Transport state={transport} />
          </div>

          {/* Right — Clock + Public Holidays */}
          <div className="min-h-0 min-w-0 flex flex-col gap-3">
            <div className="shrink-0">
              <div className="panel px-5 py-4 flex items-center justify-end">
                <Clock config={appConfig} />
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <Holidays
                state={holidays}
                town1={appConfig.holidayTown1}
                town2={appConfig.holidayTown2}
                maxItems={appConfig.holidaysMaxItems}
              />
            </div>
          </div>

        </div>
      </div>

      {/* ── News ticker — fixed at the bottom ─────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-3">
        <NewsTicker
          state={rss}
          itemDurationMs={appConfig.rssItemDurationSeconds * 1000}
        />
      </div>
    </div>
  );
}
