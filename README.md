# BijeCache

**BijeCache** is the cache and coordination layer for **ArbiTrac**.  
Its current job is to fetch and cache the active sports list from The Odds API, then serve it to other machines/services on your network through a lightweight HTTP endpoint.

---

## What it does right now

1. Prompts for an API key at startup.
2. Fetches all sports from The Odds API.
3. Caches the sports keys in memory.
4. Saves a full sports snapshot to `sports_cache.json`.
5. Exposes the cached sports list at:
   - `GET /active-sports`

---

## Project Structure

- `server.js` — main cache server (Express + startup flow)
- `test.js` — simple client test script to call `/active-sports`
- `start.sh` — helper script to install deps and run server
- `sports_cache.json` — persisted snapshot of last sports fetch
- `config.json` — token-related config data (currently not wired into runtime flow)
- `package.json` — dependencies (`axios`, `express`)

---

## How it works (step-by-step)

### Step 1: Start the service
Run:

```bash
./start.sh
```

Or:

```bash
npm install
node server.js
```

### Step 2: Enter your API key
On startup, `server.js` asks:

```text
What is your API key?
```

The key is stored in memory for that run.

### Step 3: Initial data fetch
`getActiveSports()` calls:

```text
https://api.the-odds-api.com/v4/sports?apiKey=<key>&all=true
```

Then it:
- extracts each sport `key`
- stores keys in `cachedSports`
- updates `lastSportsFetchTime`
- writes raw sports data to `sports_cache.json`

### Step 4: API server comes online
Express starts on port `3000` and logs a LAN URL like:

```text
http://<local-ip>:3000/active-sports
```

### Step 5: Consumers request cached data
Any ArbiTrac service can call:

```http
GET /active-sports
```

Response shape:

```json
{
  "success": true,
  "count": 42,
  "sports": ["soccer_epl", "basketball_nba", "mma_mixed_martial_arts"]
}
```

If cache is not ready yet:

```json
{
  "error": "Data is still loading..."
}
```

---

## Cache behavior

- Sports cache TTL is **24 hours** (`SPORTS_CACHE_MS`).
- If cache is fresh, requests use memory only.
- If cache is stale or empty, sports are fetched again from The Odds API.
- Current refresh is fetch-on-demand at startup; periodic background refresh is prepared in code comments for future expansion.

---

## Using BijeCache inside ArbiTrac

1. Deploy BijeCache on one reachable host in your network.
2. Start it and complete API key prompt.
3. Point other ArbiTrac components to:
   - `http://<bijecache-host>:3000/active-sports`
4. Downstream services use returned `sports[]` keys to schedule odds fetch jobs.

`test.js` is a simple example consumer that calls the endpoint and logs the first few sports.

---

## Roadmap: odds + fetch orchestration (next phase)

BijeCache is already structured to expand into full odds caching. A clean path is:

1. Add a `fetchAllOdds()` worker that loops through active sports.
2. Request odds by sport/region/market using The Odds API.
3. Store normalized odds snapshots in memory + disk cache.
4. Expose new read endpoints, for example:
   - `GET /odds/:sport`
   - `GET /odds?sport=<key>&market=h2h`
   - `GET /health`
5. Add refresh intervals (already hinted in code via `setInterval(...)`) to keep odds warm for ArbiTrac consumers.

---

## Notes

- Keep API keys out of source control.
- The current implementation uses a single runtime token entered at startup.
- `config.json` includes token metadata but is not yet used by `server.js`.
