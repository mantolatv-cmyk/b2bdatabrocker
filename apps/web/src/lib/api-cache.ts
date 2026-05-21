/**
 * ═══════════════════════════════════════════
 * B2B Data Broker — External API Cache
 * ═══════════════════════════════════════════
 * In-memory cache wrapper for external HTTP calls (AwesomeAPI, RSS, BCB SGS).
 * Implements fallback mechanics, timeouts, and stale-while-revalidate behavior.
 */

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

// Global cache storage
const cache = new Map<string, CacheEntry<any>>();

// Default TTL: 15 minutes
const DEFAULT_TTL_MS = 15 * 60 * 1000;

interface FetchCacheOptions<T> {
  ttl?: number;
  fallback: T;
  parser?: (text: string) => any;
}

/**
 * Fetches JSON or parsed text from a URL with in-memory caching.
 * Protects against rate limits and returns stale/fallback data on failure.
 */
export async function fetchWithCache<T>(
  url: string,
  options: FetchCacheOptions<T>
): Promise<T> {
  const now = Date.now();
  const cached = cache.get(url);

  // Return fresh cached data if valid
  if (cached && cached.expiry > now) {
    return cached.data as T;
  }

  try {
    // Implement timeout signal to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "B2B-Data-Broker-App/2.0",
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    let parsedData: any;
    if (options.parser) {
      const text = await res.text();
      parsedData = options.parser(text);
    } else {
      parsedData = await res.json();
    }

    // Update cache
    cache.set(url, {
      data: parsedData,
      expiry: now + (options.ttl ?? DEFAULT_TTL_MS),
    });

    return parsedData as T;
  } catch (error) {
    console.warn(
      `[API Cache] Error fetching ${url}. Falling back to cached/default.`,
      (error as Error).message
    );

    // If we have stale cached data, use it and delay next attempt by 2 minutes
    if (cached) {
      cached.expiry = now + 2 * 60 * 1000; // retry in 2 minutes
      return cached.data as T;
    }

    // Otherwise return default fallback
    return options.fallback;
  }
}
