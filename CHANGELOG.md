# Changelog

All notable changes to TL-Dashboard are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [0.3.1] — 2026-05-22

### Fixed
- **METAR 502 errors** — fetch now retries up to 3 times with back-off before falling back to the last known good observation. The widget shows a `STALE` badge instead of an error during transient AWC API outages.

### Changed
- **GitHub Actions — Node.js 24** — updated all action versions ahead of the June 2 2026 forced migration:
  - `docker/setup-qemu-action` v3 → v4
  - `docker/setup-buildx-action` v3 → v4
  - `docker/login-action` v3 → v4
  - `docker/metadata-action` v5 → v6
  - `docker/build-push-action` v5 → v6
  - Added `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` workflow env variable

---

## [0.3.0] — 2026-05-22

### Added
- **METAR widget** — bottom-right panel showing decoded aviation weather (flight category, wind, visibility, QNH, sky conditions) for any ICAO airport code. No API key required (aviationweather.gov).
- **Settings panel** — slide-in drawer accessible via a gear icon on every widget header. All previously env-var-only settings (weather location, SBB station, commute route, iCal URL, holidays, RSS feeds, METAR ICAO, slideshow interval, etc.) can now be changed at runtime and are persisted to `data/settings.json` on the server.
- **Widget scaling** — every widget has a Scale (%) slider in its settings section. News Ticker defaults to 125% for better living-room legibility.
- **Touch-friendly UI** — minimum 44 px tap targets on all interactive elements, `touch-action: manipulation` on buttons and inputs, active/focus states replacing hover-only interactions, larger input fields.
- **`data/` volume** — persistent settings storage at `/app/data/settings.json`; survives container restarts and updates.

### Changed
- All data services now read key parameters (lat/lon, station name, iCal URL, holiday country/cantons, METAR ICAO) from `getEffectiveConfig()` at fetch time. Changing a setting in the UI takes effect on the next data refresh without a backend restart.
- Cache keys include the effective setting value — switching locations/stations/countries automatically invalidates stale cache entries.

---

## [0.2.0] — 2026-05-21

### Changed
- **Single-container architecture** — backend and frontend now ship as one Docker image (`techlotse/tl-dashboard-core`). nginx is removed; Express serves the React SPA, background images, and API from a single process on port 3001.
- **Root `Dockerfile`** — three-stage multi-arch build (frontend → backend → runtime). Replaces the separate `backend/Dockerfile` + `frontend/Dockerfile` build path for production.
- **`docker-compose.yml`** — simplified to a single `dashboard` service; `docker-compose.hub.yml` deprecated.
- **GitHub Actions CI** — two separate build jobs (backend + frontend) replaced by one job building the root `Dockerfile`.
- **Background image serving** — moved from nginx static files to `express.static` on `/backgrounds/*`, served directly from the mounted volume.
- **SPA fallback** — Express handles the `*` catch-all with long-lived asset caching (`immutable, max-age=1y`) and 1-hour cache for background images.

---

## [0.1.0] — 2026-05-21

### Added
- **`VERSION` file** — single source of version truth at repo root.
- **Four new `.env` settings** wired through the full stack:
  - `BACKGROUND_INTERVAL_SECONDS` (default `15`) — seconds between slideshow photo changes.
  - `RSS_ITEM_DURATION_SECONDS` (default `10`) — seconds each news headline is shown.
  - `HOLIDAYS_MAX_ITEMS` (default `8`) — number of upcoming public holidays displayed.
  - `CALENDAR_DISPLAY_DAYS` (default `14`) — days of calendar events shown in the widget.
- **Deployment README** — rewritten as a deployer-focused guide with version/build badges, full env variable tables, Google Calendar setup instructions, and kiosk (Raspberry Pi) setup.
- **`docs/ARCHITECTURE.md`** — technical reference covering project structure, data sources, API endpoint catalogue, CI/CD setup, and local dev commands.
- **GitHub Actions** — Docker repo configurable via `vars.DOCKER_REPO` org variable; credentials via `ORG_DOCKERHUB_USER` / `ORG_DOCKERHUB_KEY` org secrets.

### Changed
- **SBB departure board** — row spacing halved (`py-2` → `py-1`) for better density at large screen sizes.
- **Panel backgrounds** — reduced to 18% opacity; backdrop blur removed entirely so background photos show through clearly.
- **`docker-compose.yml`** — `env_file` marked `required: false` so CI validate step passes without a `.env` file present.

### Fixed
- **Calendar widget crash** — `new Date(isoString + 'T00:00:00')` produced an invalid date for all-day events where the backend already sends full ISO strings. Fixed with a `safeParse()` helper that strips the time portion before parsing.
- **Background images 403** — nginx `alias` directive outside the html root returned 403. Fixed by mounting `./backgrounds` directly under nginx's html root.
- **nginx regex intercept** — `location ~* \.(jpg|…)` was intercepting `/api/backgrounds/photo.jpg` before the API location block. Fixed with a `^~` prefix modifier on the `/api/` location.
- **TypeScript build failure** — `React.ElementType` used without importing React in `WeatherIcon.tsx` under strict mode. Fixed by using `LucideIcon` from `lucide-react`.

---

## [0.0.1] — 2026-05-19

### Added
- Initial release.
- Live weather widget (Open-Meteo — current conditions, hourly today, 3-day forecast).
- Swiss public transport departure board with optional commute route (transport.opendata.ch).
- Google Calendar widget (iCal URL or service account API).
- Swiss public holidays widget (Nager.Date, national + cantonal).
- Live 24-hour clock.
- Background photo slideshow from a local folder.
- Scrolling RSS news ticker.
- Two-container Docker setup (Node.js backend + nginx frontend).
- Multi-arch Docker images (`linux/amd64`, `linux/arm64`) via GitHub Actions.
- Full `.env` configuration with `.env.example` template.

[0.2.0]: https://github.com/techlotse/TL-Dashboard-Core/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/techlotse/TL-Dashboard-Core/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/techlotse/TL-Dashboard-Core/releases/tag/v0.0.1
