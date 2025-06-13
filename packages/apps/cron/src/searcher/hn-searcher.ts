import {ISearcher} from '.';
import { rateLimitedFetch } from '../rate-limiter';

type Hits = {
  hits: Array<{
    objectID: string;
  }>;
};

class HackerNewsSearcher implements ISearcher {
  async search(keyword: string, after: number): Promise<string[]> {
    const afterEpochSecs = Math.floor(after / 1000);
    const url = `https://hn.algolia.com/api/v1/search_by_date?query="${keyword}"&tags=(story,comment)&numericFilters=created_at_i%3E${afterEpochSecs}`;
    const res = await rateLimitedFetch(url);
    const json: Hits = (await res.json()) as Hits;
    return json.hits.map(item => `https://news.ycombinator.com/item?id=${item.objectID}`);
  }
}

export default HackerNewsSearcher;
