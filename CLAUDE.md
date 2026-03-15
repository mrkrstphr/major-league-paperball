# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**major-league-paperball** displays MLB game data on a Waveshare 7.5" e-ink screen connected to a Raspberry Pi. The Node app fetches MLB Stats API data, uses Puppeteer to screenshot an Express/Handlebars web app, then sends the screenshot to the display via a Python script.

## Commands

```bash
npm run dev          # Run with nodemon (TypeScript hot reload via ts-node)
npm start            # Run compiled JS (requires build first)
npm run build        # Compile TypeScript + copy views/assets to dist/
npm test             # Run Jest tests
```

Run a single test file:
```bash
npx jest app/utils/liveGame.test.ts
```

Run the fake server for UI development with mock data (no MLB API calls):
```bash
npx ts-node fakeServer.ts mocks/livegame/some-game.json
# Serves on port 9999
```

## Architecture

### Main Loop (`index.ts`)
A cron job fires every 20 seconds, calling `getNextState()`. If the state has changed, it takes a Puppeteer screenshot of `http://localhost:3000` and sends it to `display.py` (Python). The Express server always renders the current in-memory state.

### State Machine (`app/engine/`)
`getNextState()` returns one of these modes based on schedule data:
- `missing-team` — `TEAM_ID` not configured; shows list of teams
- `standings` — No game today/soon; shows division standings
- `preview` — Game starting soon; shows upcoming matchup
- `live-game` — Game in progress
- `end-of-inning` — Between innings during a live game
- `end-of-game` — Game just ended (shown for `GAME_END_DELAY_MINUTES`, default 20)
- `offline` — Initial state before first fetch

The mode string maps 1:1 to Handlebars template names in `app/views/`.

### Data Flow
```
MLB Stats API → app/api.ts → app/engine/ → app/state.ts
                                              ↓
                                    app/server.ts (Express)
                                              ↓
                                    app/views/*.hbs (rendered at /)
                                              ↓
                                    Puppeteer screenshot → display.py
```

### Mocking
`app/mockedData.ts` intercepts API calls when `MOCKS` env var points to a JSON index file (e.g., `mocks/live-game.json`). Mock files support `{{TODAY}}` placeholder to inject the current date. The `debug/` directory gets raw game JSON dumps when `DEBUG_DUMP_GAME=true`.

### Views
Handlebars templates in `app/views/` with:
- `layouts/` — Main layout wrapper
- `partials/` — Reusable components (bases, scorecard, matchup, standings, etc.)
- `helpers/` — Custom Handlebars helpers (`gt`, `gte`, `lt`, `includes`, `notNil`, `repeat`)
- `.stories.js` files alongside templates for Storybook

### Key Environment Variables
| Variable | Description |
|---|---|
| `TEAM_ID` | MLB team numeric ID (required) |
| `BROWSER_BIN` | Path to Chromium binary |
| `WAVESHARE_EPD75_VERSION` | Display version: `1`, `2`, or `2B` |
| `WITHOUT_PAPER=true` | Skip writing to display (dev use) |
| `DEBUG=true` | Enable debug console logging |
| `DEBUG_DUMP_GAME=true` | Dump live game JSON to `debug/` |
| `MOCKS` | Path to mock data index JSON file |
| `DATE_FORMAT` | `american` (default) or `world` |
| `GAME_END_DELAY_MINUTES` | Minutes to show final score (default 20) |

### Build Output
`npm run build` compiles TypeScript to `dist/` and copies `.hbs` views, partials, layouts, and runtime files. The `dist/` directory is what gets deployed.
