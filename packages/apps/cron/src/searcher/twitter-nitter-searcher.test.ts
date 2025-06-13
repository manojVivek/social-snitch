import TwitterNitterSearcher from './twitter-nitter-searcher';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('TwitterNitterSearcher', () => {
  let searcher: TwitterNitterSearcher;

  beforeEach(() => {
    searcher = new TwitterNitterSearcher();
    mockFetch.mockReset();
    // Mock timers for delay testing
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('search', () => {
    it('should return an array of Twitter URLs when Nitter returns results', async () => {
      const mockHtml = `
        <div class="timeline">
          <div class="timeline-item">
            <a class="tweet-link" href="/elonmusk/status/1234567890123456789">Tweet 1</a>
          </div>
          <div class="timeline-item">
            <a class="tweet-link" href="/jack/status/9876543210987654321">Tweet 2</a>
          </div>
        </div>
      `;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => mockHtml
      });

      const results = await searcher.search('test keyword', new Date('2019-01-01').getTime());

      expect(results).toEqual([
        'https://twitter.com/elonmusk/status/1234567890123456789',
        'https://twitter.com/jack/status/9876543210987654321'
      ]);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/search?q=test%20keyword%20since%3A')
      );
    });

    it('should handle empty search results', async () => {
      const mockHtml = `<div class="timeline"></div>`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => mockHtml
      });

      const results = await searcher.search('nonexistent', Date.now());

      expect(results).toEqual([]);
    });

    it('should handle Nitter instance failure', async () => {
      // Instance fails
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const results = await searcher.search('test', new Date('2010-01-01').getTime());

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(results).toEqual([]);
    });

    it('should extract correct Twitter URLs from various Nitter URL formats', async () => {
      const mockHtml = `
        <a href="/bitcoin/status/1111111111111111111">BTC Tweet</a>
        <a href="/CryptoExchange/status/2222222222222222222">Exchange Tweet</a>
        <a href="/web3_user/status/3333333333333333333">Web3 Tweet</a>
      `;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => mockHtml
      });

      const results = await searcher.search('crypto', new Date('2018-01-01').getTime());

      expect(results).toEqual([
        'https://twitter.com/bitcoin/status/1111111111111111111',
        'https://twitter.com/CryptoExchange/status/2222222222222222222',
        'https://twitter.com/web3_user/status/3333333333333333333'
      ]);
    });

    it('should limit results to 20 tweets', async () => {
      // Generate HTML with 25 tweets
      let mockHtml = '';
      for (let i = 1; i <= 25; i++) {
        mockHtml += `<a href="/user${i}/status/${i}">Tweet ${i}</a>\n`;
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => mockHtml
      });

      const results = await searcher.search('popular topic', new Date('2010-01-01').getTime());

      expect(results).toHaveLength(20);
      expect(results[0]).toBe('https://twitter.com/user1/status/1');
      expect(results[19]).toBe('https://twitter.com/user20/status/20');
    });

    it('should handle malformed Nitter URLs gracefully', async () => {
      const mockHtml = `
        <a href="/user/status/123">Valid Tweet</a>
        <a href="/broken/url">Invalid URL</a>
        <a href="/status/456">Missing username</a>
        <a href="/user/status/">Missing ID</a>
        <a href="/anotheruser/status/789">Another Valid Tweet</a>
      `;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => mockHtml
      });

      const results = await searcher.search('test', new Date('2010-01-01').getTime());

      expect(results).toEqual([
        'https://twitter.com/user/status/123',
        'https://twitter.com/anotheruser/status/789'
      ]);
    });

    it('should handle non-200 responses correctly', async () => {
      // Instance returns 404
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not Found'
      });

      const results = await searcher.search('test', new Date('2010-01-01').getTime());

      expect(results).toEqual([]);
    });

    it('should use date filtering with since parameter', async () => {
      const afterDate = new Date('2023-12-01T10:00:00Z');
      const afterTimestamp = afterDate.getTime();
      
      const mockHtml = `<a href="/user/status/123">Tweet</a>`;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => mockHtml
      });

      await searcher.search('test', afterTimestamp);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('since%3A2023-12-01')
      );
    });

    it('should filter out tweets from same day but before the specific time', async () => {
      // Use actual Twitter IDs for realistic testing
      // 1734567890123456789 ≈ Dec 13, 2023 (newer)
      // 1600000000000000000 ≈ Sep 2022 (older)
      const afterTimestamp = new Date('2023-01-01T00:00:00Z').getTime();
      
      const mockHtml = `
        <a href="/user1/status/1600000000000000000">Old tweet</a>
        <a href="/user2/status/1734567890123456789">New tweet</a>
      `;
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => mockHtml
      });

      const results = await searcher.search('testfiltering', afterTimestamp);
      
      // Should only include the newer tweet
      expect(results).toEqual(['https://twitter.com/user2/status/1734567890123456789']);
    });

    it('should handle pagination to get more than first page results', async () => {
      const afterTimestamp = new Date('2020-01-01').getTime();
      
      // First page with cursor for next page
      const firstPageHtml = `
        <a href="/user1/status/1234567890123456789">Tweet 1</a>
        <a href="/user2/status/1234567890123456790">Tweet 2</a>
        <div class="show-more"><a href="/search?q=pagination%20since%3A2020-01-01&f=tweets&cursor=abc123">Show more</a></div>
      `;
      
      // Second page
      const secondPageHtml = `
        <a href="/user3/status/1234567890123456791">Tweet 3</a>
        <a href="/user4/status/1234567890123456792">Tweet 4</a>
      `;
      
      mockFetch.mockClear();
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => firstPageHtml
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => secondPageHtml
        });

      const searchPromise = searcher.search('pagination', afterTimestamp);
      
      // No delay for first page
      await jest.advanceTimersByTimeAsync(0);
      
      // Advance timer for delay between pages
      await jest.advanceTimersByTimeAsync(1000);
      
      const results = await searchPromise;
      
      expect(results).toEqual([
        'https://twitter.com/user1/status/1234567890123456789',
        'https://twitter.com/user2/status/1234567890123456790',
        'https://twitter.com/user3/status/1234567890123456791',
        'https://twitter.com/user4/status/1234567890123456792'
      ]);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should stop pagination when no more results available', async () => {
      const afterTimestamp = new Date('2020-01-01').getTime();
      
      // Single page with no pagination
      const singlePageHtml = `
        <a href="/user1/status/1234567890123456789">Tweet 1</a>
        <a href="/user2/status/1234567890123456790">Tweet 2</a>
      `;
      
      mockFetch.mockClear();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => singlePageHtml
      });

      const results = await searcher.search('nopagination', afterTimestamp);
      
      expect(results).toEqual([
        'https://twitter.com/user1/status/1234567890123456789',
        'https://twitter.com/user2/status/1234567890123456790'
      ]);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should apply delays between multiple pagination requests', async () => {
      const afterTimestamp = new Date('2020-01-01').getTime();
      
      // Three pages to test multiple delays
      const page1Html = `
        <a href="/user1/status/1">Tweet 1</a>
        <div class="show-more"><a href="/search?cursor=page2">Show more</a></div>
      `;
      const page2Html = `
        <a href="/user2/status/2">Tweet 2</a>
        <div class="show-more"><a href="/search?cursor=page3">Show more</a></div>
      `;
      const page3Html = `
        <a href="/user3/status/3">Tweet 3</a>
      `;
      
      mockFetch.mockClear();
      mockFetch
        .mockResolvedValueOnce({ ok: true, status: 200, text: async () => page1Html })
        .mockResolvedValueOnce({ ok: true, status: 200, text: async () => page2Html })
        .mockResolvedValueOnce({ ok: true, status: 200, text: async () => page3Html });

      const searchPromise = searcher.search('multipage', afterTimestamp);
      
      // No delay for first page
      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      // First delay (1000ms)
      await jest.advanceTimersByTimeAsync(1000);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      
      // Second delay (1000ms)
      await jest.advanceTimersByTimeAsync(1000);
      expect(mockFetch).toHaveBeenCalledTimes(3);
      
      const results = await searchPromise;
      
      expect(results).toEqual([
        'https://twitter.com/user1/status/1',
        'https://twitter.com/user2/status/2',
        'https://twitter.com/user3/status/3'
      ]);
    });
  });
});
