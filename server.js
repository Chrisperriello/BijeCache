const axios = require('axios');
const os = require('os');
const fs = require('fs');
const express = require('express');
const readline = require('readline/promises');

const app = express();
const PORT = 3000;

const API_CONFIG = {
  tokens: [],
  base_url: 'https://api.the-odds-api.com/v4/sports',
  regions: 'us',
  markets: 'h2h'
};

// State management
let tokenIndex = 0;
let cachedSports = [];
let lastSportsFetchTime = 0;
const SPORTS_CACHE_MS = 24 * 60 * 60 * 1000; 

/**
 * Logic to get sports only when necessary
 */
async function getActiveSports() {
  const now = Date.now();

  if (cachedSports.length > 0 && (now - lastSportsFetchTime < SPORTS_CACHE_MS)) {
    console.log("Using cached sports list...");
    return cachedSports;
  }

  console.log("Fetching new sports list from API...");
  const token = API_CONFIG.tokens[tokenIndex % API_CONFIG.tokens.length];
  
  try {
    const res = await axios.get(`${API_CONFIG.base_url}?apiKey=${token}&all=true`);
    cachedSports = res.data.map(s => s.key);
    lastSportsFetchTime = now;
    fs.writeFileSync('./sports_cache.json', JSON.stringify(res.data, null, 2));
    return cachedSports;
  } catch (err) {
    console.error("Failed to fetch sports list:", err.message);
    return cachedSports;
  }
}

/**
 * Utility to find local IP
 */
function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// Express Endpoint
app.get('/active-sports', (req, res) => {
    if (cachedSports.length === 0) {
        return res.status(503).json({ error: "Data is still loading..." });
    }
    res.json({ success: true, count: cachedSports.length, sports: cachedSports });
});

/**
 * MAIN STARTUP FUNCTION
 * This controls the order of operations
 */
async function start() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    // 1. Wait for API Key
    const api = await rl.question(' What is your API key? ');
    if (api.trim()) {
        API_CONFIG.tokens.push(api.trim());
        console.log("API Key stored.");
    }
    rl.close(); // Close the input stream

    // 2. Fetch Sports for the first time
    await getActiveSports();

    // 3. Start the Express Server
    app.listen(PORT, () => {
        const ip = getLocalIp();
        console.log('--------------------------------------------------');
        console.log('ARB ORCHESTRATOR IS LIVE');
        console.log(`Local Network URL: http://${ip}:${PORT}/active-sports`);
        console.log('--------------------------------------------------');
    });

    // 4. (Optional) Set up the background interval for odds or sports refreshes
    // setInterval(fetchAllOdds, 300000); 
}

// Kick it off
start();