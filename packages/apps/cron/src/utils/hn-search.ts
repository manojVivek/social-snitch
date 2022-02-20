import fetch from 'isomorphic-fetch';

type Hits = {
  hits: Array<{
    objectID: string;
  }>;
};

const findNewItems = async (keyword, after) => {
  const url = `https://hn.algolia.com/api/v1/search_by_date?query="${keyword}"&tags=(story,comment)&numericFilters=created_at_i%3E${after}`;
  const res = await fetch(url);
  const json: Hits = (await res.json()) as Hits;
  return json.hits.map(item => `https://news.ycombinator.com/item?id=${item.objectID}`);
};

export const searchHackerNews = async (keyword, after) => {
  const newItems = await findNewItems(keyword, after);
  return newItems;
};
