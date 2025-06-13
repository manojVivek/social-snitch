import Bottleneck from 'bottleneck';

// Rate limiter instances for different services
const rateLimiters: { [key: string]: Bottleneck } = {};

// Default configuration: 1 request per second
const DEFAULT_MIN_TIME = 1000; // milliseconds between requests
const DEFAULT_MAX_CONCURRENT = 1; // max concurrent requests

// Service-specific configurations
const SERVICE_CONFIGS: { [key: string]: { minTime: number; maxConcurrent: number } } = {
  'nitter.net': { minTime: 1000, maxConcurrent: 1 }, // 1 request per second
  'api.pushshift.io': { minTime: 1000, maxConcurrent: 2 }, // 1 requests per second
  'hn.algolia.com': { minTime: 1000, maxConcurrent: 3 }, // 1 requests per second
  'bsky.social': { minTime: 1000, maxConcurrent: 5 }, // 1 requests per second
  'oauth.reddit.com': { minTime: 100, maxConcurrent: 10 }, // Reddit has generous limits
};

/**
 * Get or create a rate limiter for a specific service/domain
 */
export function getRateLimiter(serviceKey: string): Bottleneck {
  if (!rateLimiters[serviceKey]) {
    const config = SERVICE_CONFIGS[serviceKey] || {
      minTime: DEFAULT_MIN_TIME,
      maxConcurrent: DEFAULT_MAX_CONCURRENT,
    };

    rateLimiters[serviceKey] = new Bottleneck({
      minTime: config.minTime,
      maxConcurrent: config.maxConcurrent,
    });

    // Log rate limiter creation
    if (process.env.NODE_ENV !== 'test') {
      console.log(`Created rate limiter for ${serviceKey}:`, config);
    }
  }

  return rateLimiters[serviceKey];
}

/**
 * Extract service key from URL
 */
export function getServiceKeyFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    // Fallback to default if URL parsing fails
    return 'default';
  }
}

/**
 * Wrap a fetch request with rate limiting
 */
export async function rateLimitedFetch(url: string, options?: RequestInit): Promise<Response> {
  const serviceKey = getServiceKeyFromUrl(url);
  const limiter = getRateLimiter(serviceKey);

  return limiter.schedule(() => fetch(url, options));
}

/**
 * Wrap any async function with rate limiting for a specific service
 */
export async function withRateLimit<T>(
  serviceKey: string,
  fn: () => Promise<T>
): Promise<T> {
  const limiter = getRateLimiter(serviceKey);
  return limiter.schedule(fn);
}

/**
 * Clear all rate limiters (useful for testing)
 */
export function clearRateLimiters(): void {
  Object.keys(rateLimiters).forEach(key => {
    rateLimiters[key].disconnect();
    delete rateLimiters[key];
  });
}
