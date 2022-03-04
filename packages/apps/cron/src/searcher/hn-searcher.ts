import fetch from 'isomorphic-fetch';
import {ISearcher} from '.';

type Hits = {
  hits: Array<{
    objectID: string;
  }>;
};

class HackerNewsSearcher implements ISearcher {
  async search(keyword: string, after: number): Promise<string[]> {
    const url = `https://hn.algolia.com/api/v1/search_by_date?query="${keyword}"&tags=(story,comment)&numericFilters=created_at_i%3E${after}`;
    const res = await fetch(url);
    const json: Hits = (await res.json()) as Hits;
    return json.hits.map(item => `https://news.ycombinator.com/item?id=${item.objectID}`);
  }
}

export default HackerNewsSearcher;
