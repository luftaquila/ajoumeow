import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import schedule from 'node-schedule';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface WeatherCurrent {
  weather: string;
  temp: number;
  tempSense: number;
  icon: string;
  dust: {
    pm10: string;
    pm25: string;
  };
}

export interface WeatherForecast {
  date: string;
  weather: string;
  temp: number;
  icon: string;
}

export interface WeatherData {
  current: WeatherCurrent;
  forecast: WeatherForecast[];
  update: string;
}

let weatherCache: WeatherData | null = null;

/** Return the cached weather data (or null if none collected yet). */
export function getWeatherData(): WeatherData | null {
  return weatherCache;
}

/**
 * Attempt to fetch current weather + dust + forecast from kweather.co.kr.
 * The kweather pages render data via JavaScript, so plain HTTP fetch may
 * return incomplete HTML.  When that happens we fall back to the legacy
 * static weather.json shipped with the old frontend.
 */
async function fetchWeatherData(): Promise<void> {
  try {
    // Try fetching the kweather digital weather page for Suwon Yeongtong-gu
    const weatherUrl =
      'http://www.kweather.co.kr/kma/kma_digital.html?area1=area_8&area2=19&area3=1038%7C%EC%9B%90%EC%B2%9C%EB%8F%99';
    const dustUrl =
      'http://kweather.co.kr/air/air_area_realtime_popup6_kiot.html?acode=4111755000&pm=pm25';

    const [weatherRes, dustRes] = await Promise.allSettled([
      fetch(weatherUrl, { signal: AbortSignal.timeout(10_000) }),
      fetch(dustUrl, { signal: AbortSignal.timeout(10_000) }),
    ]);

    let currentWeather: string | undefined;
    let currentTemp: number | undefined;
    let dustPm10: string | undefined;
    let dustPm25: string | undefined;

    // Parse weather HTML (best-effort: content may be JS-rendered)
    if (weatherRes.status === 'fulfilled' && weatherRes.value.ok) {
      const html = await weatherRes.value.text();
      // Try to extract temperature from static HTML
      const tempMatch = html.match(/([-\d.]+)\s*℃/);
      if (tempMatch) currentTemp = Math.round(parseFloat(tempMatch[1]));
      // Try to extract weather status text
      const statusMatch = html.match(
        /kma_digital_predent_wtext[^>]*>([^<]+)/,
      );
      if (statusMatch) {
        const parts = statusMatch[1].trim().split(/\s+/);
        if (parts.length >= 2) currentWeather = parts.slice(1).join(' ');
      }
    }

    // Parse dust HTML (best-effort)
    if (dustRes.status === 'fulfilled' && dustRes.value.ok) {
      const html = await dustRes.value.text();
      const pm10Match = html.match(/nowdata_pm10_value[^>]*>(\d+)/);
      const pm25Match = html.match(/nowdata_pm25_value[^>]*>(\d+)/);
      if (pm10Match) dustPm10 = pm10Match[1];
      if (pm25Match) dustPm25 = pm25Match[1];
    }

    // If we got at least a temperature, build fresh data
    if (currentTemp !== undefined) {
      weatherCache = {
        current: {
          weather: currentWeather ?? '',
          temp: currentTemp,
          tempSense: currentTemp,
          icon: '',
          dust: {
            pm10: dustPm10 ?? '',
            pm25: dustPm25 ?? '',
          },
        },
        forecast: weatherCache?.forecast ?? [],
        update: new Date().toISOString().replace('T', ' ').slice(0, 19),
      };
      console.log('[weather] Successfully fetched weather data from kweather');
      return;
    }

    // Fetch didn't yield usable data — fall back to static file
    loadFallbackWeatherJson();
  } catch (err) {
    console.error('[weather] Failed to fetch weather data:', err);
    // Try fallback file if cache is empty
    if (!weatherCache) loadFallbackWeatherJson();
  }
}

/** Load the legacy weather.json shipped with the old frontend as a fallback. */
function loadFallbackWeatherJson(): void {
  try {
    const fallbackPath = path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'web',
      'res',
      'weather.json',
    );
    if (fs.existsSync(fallbackPath)) {
      const raw = fs.readFileSync(fallbackPath, 'utf-8');
      weatherCache = JSON.parse(raw) as WeatherData;
      console.log('[weather] Loaded fallback weather.json');
    }
  } catch (err) {
    console.error('[weather] Failed to load fallback weather.json:', err);
  }
}

/**
 * Start the weather collection scheduler.
 * Runs every 30 minutes and fetches immediately on startup.
 */
export function startWeatherScheduler(): void {
  // Fetch immediately on startup
  fetchWeatherData().catch((err) => {
    console.error('[weather] Initial fetch failed:', err);
  });

  // Schedule every 30 minutes
  schedule.scheduleJob('*/30 * * * *', () => {
    fetchWeatherData().catch((err) => {
      console.error('[weather] Scheduled fetch failed:', err);
    });
  });
}
