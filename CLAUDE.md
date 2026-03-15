# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**major-league-paperball** displays MLB game data on a Waveshare 7.5" e-ink screen connected to a Raspberry Pi. The Node app fetches MLB Stats API data, renders a PNG via Satori + resvg-js (React TSX components), then sends the pixel buffer directly to the display via Node.js GPIO/SPI drivers.

## Commands

```bash
npm run dev          # Run with nodemon (TypeScript hot reload via ts-node)
npm start            # Run compiled JS (requires build first)
npm run build        # Compile TypeScript + copy assets to dist/
npm test             # Run Vitest tests
```

Run a single test file:
```bash
npx vitest run app/utils/liveGame.test.ts
```

Render a mock state to a PNG (dev/design tool):
```bash
npx ts-node fakeRender.ts mocks/livegame/some-game.json
# Writes output.png
```

## Architecture

### Main Loop (`index.ts`)
A cron job fires every 20 seconds, calling `getNextState()`. If the state has changed, it renders a PNG via `renderToImage()` and sends the pixel buffer to the display via `sendToDisplay()`.

### State Machine (`app/engine/`)
`getNextState()` returns one of these modes based on schedule data:
- `missing-team` — `TEAM_ID` not configured; shows list of teams
- `standings` — No game today/soon; shows division standings
- `preview` — Game starting soon; shows upcoming matchup
- `live-game` — Game in progress
- `end-of-inning` — Between innings during a live game
- `end-of-game` — Game just ended (shown for `GAME_END_DELAY_MINUTES`, default 20)
- `offline` — Initial state before first fetch

### Data Flow
```
MLB Stats API → app/api.ts → app/engine/ → app/state.ts
                                              ↓
                                    app/render.tsx (Satori → resvg-js)
                                              ↓
                                    app/display/ (Node GPIO/SPI → e-ink)
```

### Render Pipeline (`app/render.tsx`)
`renderToImage(state)` picks a React TSX component by mode, renders it to SVG via Satori, then rasterizes to PNG + pixel buffer via resvg-js. Fonts (Inter regular + bold) are loaded from `assets/`.

### Components (`app/components/`)
One TSX file per mode: `LiveGame`, `EndOfInning`, `EndOfGame`, `Preview`, `Standings`, `MissingTeam`, `Offline`. Shared pieces live in `app/components/partials/`.

### Display Driver (`app/display/`)
Pure Node.js — no Python. `sendToDisplay(pixels, width, height)` talks to the Waveshare EPD via `node-libgpiod` (GPIO) and `spi-device` (SPI). Supports EPD versions `1`, `2`, `2B` via `WAVESHARE_EPD75_VERSION`.

### Mocking
`app/mockedData.ts` intercepts API calls when `MOCKS` env var points to a JSON index file (e.g., `mocks/live-game.json`). Mock files support `{{TODAY}}` placeholder to inject the current date. The `debug/` directory gets raw game JSON dumps when `DEBUG_DUMP_GAME=true`.

### Satori Gotchas
1. Every multi-child `div` needs `display: flex`
2. Number children fail — use `String(n)` or template literals
3. Mixed text + expression = multiple children — use template literals
4. `undefined` CSS values crash — omit the key or use `'none'`
5. No `<table>` — use flex divs for tabular layouts
6. Absolutely positioned elements also need `display: flex`
7. Negative margins are silently ignored — use `position: absolute` instead

### Key Environment Variables
| Variable | Description |
|---|---|
| `TEAM_ID` | MLB team numeric ID (required) |
| `WAVESHARE_EPD75_VERSION` | Display version: `1`, `2`, or `2B` (default `2`) |
| `SCREEN_WIDTH` | Render width in px (default `800`) |
| `SCREEN_HEIGHT` | Render height in px (default `480`) |
| `WITHOUT_PAPER=true` | Skip writing to display (dev use) |
| `DEBUG=true` | Enable debug console logging |
| `DEBUG_DUMP_GAME=true` | Dump live game JSON to `debug/` |
| `MOCKS` | Path to mock data index JSON file |
| `DATE_FORMAT` | `american` (default) or `world` |
| `GAME_END_DELAY_MINUTES` | Minutes to show final score (default 20) |

### Build Output
`npm run build` compiles TypeScript to `dist/` and copies assets. The `dist/` directory is what gets deployed.
