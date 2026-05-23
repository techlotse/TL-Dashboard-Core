import { useEffect, useState } from 'react';
import Clock from './components/Clock';
import Weather from './components/Weather';
import Transport from './components/Transport';
import CalendarWidget from './components/CalendarWidget';
import Holidays from './components/Holidays';
import NewsTicker from './components/NewsTicker';
import Background from './components/Background';
import MetarWidget from './components/MetarWidget';
import SettingsPanel from './components/SettingsPanel';
import { useAutoRefresh } from './hooks/useAutoRefresh';
import {
  AppConfig,
  WeatherData,
  TransportData,
  CalendarData,
  HolidayData,
  RssData,
  BackgroundData,
  MetarData,
} from './types';

// Default config — overridden once /api/config loads
const DEFAULT_CONFIG: AppConfig = {
  timezone: 'Europe/Zurich',
  stationName: 'Station',
  weatherLat: '47.3769',
  weatherLon: '8.5417',
  commuteToStation: '',
  calendarIcalUrl: '',
  calendarDisplayDays: 14,
  holidayCountry: 'CH',
  holidayTown1: '',
  holidayTown2: '',
  holidaysMaxItems: 8,
  rssFeeds: 'https://feeds.bbci.co.uk/news/world/rss.xml',
  rssItemDurationSeconds: 10,
  backgroundIntervalSeconds: 15,
  metarIcao: 'LSZH',
  scaleClock: 1.0,
  scaleWeather: 1.0,
  scaleTransport: 1.0,
  scaleCalendar: 1.0,
  scaleHolidays: 1.0,
  scaleMetar: 1.0,
  scaleNewsTicker: 1.25,
  refreshWeatherMinutes: 30,
  refreshTransportSeconds: 60,
  refreshCalendarMinutes: 5,
  refreshRssMinutes: 10,
  metarRefreshMinutes: 30,
};

const API = '/api';

export default function App() {
  const [appConfig, setAppConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsWidget, setSettingsWidget] = useState<string>('weather');

  // Load server config once on mount
  useEffect(() => {
    fetch(`${API}/config`)
      .then((r) => r.json())
      .then((cfg: AppConfig) => setAppConfig(cfg))
      .catch(() => {/* use defaults */});
  }, []);

  function openSettings(widget: string) {
    setSettingsWidget(widget);
    setSettingsOpen(true);
  }

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
    5 * 60 * 1000,
  );

  const metar = useAutoRefresh<MetarData>(
    `${API}/metar`,
    appConfig.metarRefreshMinutes * 60 * 1000,
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
        ┌──────────┬──────────────────────┬────────────────┐
        │ Weather  │       SBB            │  22:22:ss      │
        ├──────────┤  departures/commute  ├────────────────┤
        │ Calendar │                      │  Holidays      │
        │          │                      ├────────────────┤
        │          │                      │  METAR         │
        └──────────┴──────────────────────┴────────────────┘
        └──────────────────── NEWS TICKER ─────────────────────┘
      */}
      {/*
        Fluid gap: clamp(min, viewport%, max) so on bigger screens the transparent
        spaces between panels grow, letting the background photo breathe through.
        Blocks keep their own per-widget zoom; only the void between them changes.
      */}
      <div
        className="absolute inset-0 z-10"
        style={{
          padding: 'clamp(10px, 1.2vw, 28px) clamp(10px, 1.2vw, 28px) clamp(64px, 5vw, 92px)',
        }}
      >
        <div
          className="mx-auto grid h-full min-h-0 max-w-[1800px] grid-cols-[minmax(260px,330px)_minmax(420px,560px)_minmax(300px,370px)] grid-rows-[minmax(0,1fr)] justify-center"
          style={{ gap: 'clamp(10px, 2vw, 60px)' }}
        >

          {/* Left — Weather + Calendar */}
          <div
            className="min-h-0 min-w-0 flex flex-col"
            style={{ gap: 'clamp(8px, 1.5vw, 40px)' }}
          >
            <div className="h-[360px] min-h-[320px]">
              <Weather state={weather} scale={appConfig.scaleWeather} onSettingsOpen={() => openSettings('weather')} />
            </div>
            <div className="flex-1 min-h-0">
              <CalendarWidget
                state={calendar}
                displayDays={appConfig.calendarDisplayDays}
                scale={appConfig.scaleCalendar}
                onSettingsOpen={() => openSettings('calendar')}
              />
            </div>
          </div>

          {/* Center — SBB board */}
          <div className="min-h-0 min-w-0 justify-self-center w-full">
            <Transport state={transport} scale={appConfig.scaleTransport} onSettingsOpen={() => openSettings('transport')} />
          </div>

          {/* Right — Clock + Holidays + METAR */}
          <div
            className="min-h-0 min-w-0 flex flex-col"
            style={{ gap: 'clamp(8px, 1.5vw, 40px)' }}
          >
            <div className="shrink-0">
              <div className="panel px-5 py-4">
                <Clock config={appConfig} scale={appConfig.scaleClock} onSettingsOpen={() => openSettings('clock')} />
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <Holidays
                state={holidays}
                town1={appConfig.holidayTown1}
                town2={appConfig.holidayTown2}
                maxItems={appConfig.holidaysMaxItems}
                scale={appConfig.scaleHolidays}
                onSettingsOpen={() => openSettings('holidays')}
              />
            </div>
            <div className="shrink-0">
              <MetarWidget
                state={metar}
                scale={appConfig.scaleMetar}
                onSettingsOpen={() => openSettings('metar')}
              />
            </div>
          </div>

        </div>
      </div>

      {/* ── News ticker — fixed at the bottom ─────────────────────────────── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20"
        style={{ padding: 'clamp(6px, 0.8vw, 16px)' }}
      >
        <NewsTicker
          state={rss}
          itemDurationMs={appConfig.rssItemDurationSeconds * 1000}
          scale={appConfig.scaleNewsTicker}
          onSettingsOpen={() => openSettings('rss')}
        />
      </div>

      {/* ── Settings panel ────────────────────────────────────────────────── */}
      <SettingsPanel
        open={settingsOpen}
        initialWidget={settingsWidget}
        config={appConfig}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
