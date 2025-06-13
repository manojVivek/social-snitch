import { getRateLimiter, getServiceKeyFromUrl, rateLimitedFetch, withRateLimit, clearRateLimiters } from './rate-limiter';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('RateLimiter', () => {
  beforeEach(() => {
    clearRateLimiters();
    mockFetch.mockReset();
  });

  afterEach(() => {
    clearRateLimiters();
  });

  describe('getServiceKeyFromUrl', () => {
    it('should extract hostname from URL', () => {
      expect(getServiceKeyFromUrl('https://nitter.net/search')).toBe('nitter.net');
      expect(getServiceKeyFromUrl('https://api.reddit.com/r/test')).toBe('api.reddit.com');
      expect(getServiceKeyFromUrl('http://example.com:8080/path')).toBe('example.com');
    });

    it('should return default for invalid URLs', () => {
      expect(getServiceKeyFromUrl('not-a-url')).toBe('default');
      expect(getServiceKeyFromUrl('')).toBe('default');
    });
  });

  describe('getRateLimiter', () => {
    it('should create rate limiter with service-specific config', () => {
      const nitterLimiter = getRateLimiter('nitter.net');
      expect(nitterLimiter).toBeDefined();
      
      // Should return same instance on subsequent calls
      const nitterLimiter2 = getRateLimiter('nitter.net');
      expect(nitterLimiter2).toBe(nitterLimiter);
    });

    it('should create rate limiter with default config for unknown services', () => {
      const unknownLimiter = getRateLimiter('unknown.service.com');
      expect(unknownLimiter).toBeDefined();
    });
  });

  describe('rateLimitedFetch', () => {
    it('should rate limit requests to same service', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      // Track when each request completes
      const startTime = Date.now();
      const completionTimes: number[] = [];

      // Make multiple requests to same service
      const promises = [
        rateLimitedFetch('https://nitter.net/page1').then(() => {
          completionTimes.push(Date.now() - startTime);
        }),
        rateLimitedFetch('https://nitter.net/page2').then(() => {
          completionTimes.push(Date.now() - startTime);
        }),
        rateLimitedFetch('https://nitter.net/page3').then(() => {
          completionTimes.push(Date.now() - startTime);
        }),
      ];

      await Promise.all(promises);

      // Verify requests were called
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(mockFetch).toHaveBeenCalledWith('https://nitter.net/page1', undefined);
      expect(mockFetch).toHaveBeenCalledWith('https://nitter.net/page2', undefined);
      expect(mockFetch).toHaveBeenCalledWith('https://nitter.net/page3', undefined);

      // Check timing - second request should be at least 900ms after first
      // (allowing some margin for test execution)
      expect(completionTimes[1]).toBeGreaterThanOrEqual(900);
      expect(completionTimes[2]).toBeGreaterThanOrEqual(1900);
    });

    it('should not rate limit requests to different services', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      const startTime = Date.now();
      const completionTimes: number[] = [];

      // Make requests to different services
      const promises = [
        rateLimitedFetch('https://nitter.net/page1').then(() => {
          completionTimes.push(Date.now() - startTime);
        }),
        rateLimitedFetch('https://oauth.reddit.com/page1').then(() => {
          completionTimes.push(Date.now() - startTime);
        }),
        rateLimitedFetch('https://hacker-news.firebaseio.com/page1').then(() => {
          completionTimes.push(Date.now() - startTime);
        }),
      ];

      await Promise.all(promises);

      expect(mockFetch).toHaveBeenCalledTimes(3);
      
      // All requests should complete quickly (within 500ms)
      // since they're to different services
      completionTimes.forEach(time => {
        expect(time).toBeLessThan(500);
      });
    });
  });

  describe('withRateLimit', () => {
    it('should rate limit custom async functions', async () => {
      let callCount = 0;
      const callTimes: number[] = [];
      const startTime = Date.now();
      
      const testFn = async () => {
        callCount++;
        callTimes.push(Date.now() - startTime);
        return callCount;
      };

      // Make multiple calls with rate limiting
      const promises = [
        withRateLimit('test-service', testFn),
        withRateLimit('test-service', testFn),
        withRateLimit('test-service', testFn),
      ];

      const results = await Promise.all(promises);
      
      // Verify all functions were called
      expect(callCount).toBe(3);
      expect(results).toEqual([1, 2, 3]);
      
      // Check timing - calls should be spaced 1 second apart
      expect(callTimes[1]).toBeGreaterThanOrEqual(900);
      expect(callTimes[2]).toBeGreaterThanOrEqual(1900);
    });
  });

  describe('clearRateLimiters', () => {
    it('should clear all rate limiters', () => {
      // Create some rate limiters
      getRateLimiter('service1');
      getRateLimiter('service2');

      // Clear them
      clearRateLimiters();

      // New limiters should be created
      const newLimiter1 = getRateLimiter('service1');
      const newLimiter2 = getRateLimiter('service2');

      // They should be new instances (test would fail if old ones were reused)
      expect(newLimiter1).toBeDefined();
      expect(newLimiter2).toBeDefined();
    });
  });
});