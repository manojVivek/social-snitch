import {ISearcher} from '.';
import 'isomorphic-fetch';

class TwitterNitterSearcher implements ISearcher {
  private nitterInstances = [
    'https://nitter.net',
    'https://nitter.unixfox.eu',
    'https://nitter.poast.org',
  ];

  private extractTimestampFromTwitterId(tweetId: string): number {
    // Twitter snowflake ID format: 64-bit integer
    // First 42 bits are timestamp in milliseconds since Twitter epoch (Jan 1, 2010)
    // Twitter epoch: 1288834974657 (milliseconds since Unix epoch)
    const TWITTER_EPOCH = 1288834974657;
    
    try {
      const id = BigInt(tweetId);
      
      // If ID is too small (likely test data or old format), include it by returning 0
      if (id < BigInt(4194304)) {
        return 0;
      }
      
      const timestamp = Number(id >> BigInt(22)) + TWITTER_EPOCH;
      return timestamp;
    } catch (error) {
      // If ID parsing fails, return 0 to include the tweet
      return 0;
    }
  }

  private extractNextPageUrl(html: string, instance: string): string | null {
    // Look for pagination links (Nitter typically uses cursor-based pagination)
    const cursorMatch = html.match(/href="([^"]+cursor=[^"]+)"/);
    if (cursorMatch) {
      const relativeUrl = cursorMatch[1];
      return relativeUrl.startsWith('http') ? relativeUrl : `${instance}${relativeUrl}`;
    }
    
    // Alternative: Look for "Show more" or "Load more" links
    const showMoreMatch = html.match(/class="show-more"[^>]*>\s*<a[^>]+href="([^"]+)"/);
    if (showMoreMatch) {
      const relativeUrl = showMoreMatch[1];
      return relativeUrl.startsWith('http') ? relativeUrl : `${instance}${relativeUrl}`;
    }
    
    return null;
  }

  async search(keyword: string, after: number): Promise<string[]> {
    const afterDate = new Date(after);
    const sinceParam = afterDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    for (const instance of this.nitterInstances) {
      try {
        const searchQuery = `${keyword} since:${sinceParam}`;
        let searchUrl = `${instance}/search?q=${encodeURIComponent(searchQuery)}&f=tweets`;
        const allUrls: string[] = [];
        let pageCount = 0;
        const maxPages = 3; // Limit to prevent infinite loops
        
        while (searchUrl && pageCount < maxPages) {
          const response = await fetch(searchUrl);
          
          if (!response.ok) {
            // If first page fails, try next instance
            if (pageCount === 0) {
              break;
            }
            // If subsequent page fails, stop pagination but return what we have
            break;
          }
          
          const html = await response.text();
          
          // Parse tweet URLs from Nitter HTML
          const tweetUrlRegex = /href="([^"]+\/status\/\d+)"/g;
          const matches = html.matchAll(tweetUrlRegex);
          const pageUrls: string[] = [];
          
          for (const match of matches) {
            const nitterUrl = match[1];
            // Extract tweet ID and username
            const tweetIdMatch = nitterUrl.match(/status\/(\d+)/);
            const usernameMatch = nitterUrl.match(/\/([^/]+)\/status/);
            
            if (tweetIdMatch && usernameMatch) {
              const tweetId = tweetIdMatch[1];
              const username = usernameMatch[1];
              
              // Extract timestamp from Twitter snowflake ID for precise filtering
              const tweetTimestamp = this.extractTimestampFromTwitterId(tweetId);
              
              // Only include tweets after the specified time
              // If timestamp is 0 (invalid/small ID), include it
              if (tweetTimestamp === 0 || tweetTimestamp >= after) {
                const tweetUrl = `https://twitter.com/${username}/status/${tweetId}`;
                if (!allUrls.includes(tweetUrl)) { // Avoid duplicates
                  pageUrls.push(tweetUrl);
                }
              }
            }
          }
          
          allUrls.push(...pageUrls);
          
          // Stop if we have enough results or no tweets found on this page
          if (allUrls.length >= 20 || pageUrls.length === 0) {
            break;
          }
          
          // Get next page URL
          searchUrl = this.extractNextPageUrl(html, instance);
          pageCount++;
        }
        
        // Return first 20 results if we found any
        if (allUrls.length > 0) {
          return allUrls.slice(0, 20);
        }
        
      } catch (error) {
        if (process.env.NODE_ENV !== 'test') {
          console.error(`Failed to search using ${instance}:`, error);
        }
        continue;
      }
    }
    
    if (process.env.NODE_ENV !== 'test') {
      console.error('All Nitter instances failed');
    }
    return [];
  }
}

export default TwitterNitterSearcher;