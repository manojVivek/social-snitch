import {ISearcher} from '.';
import {Client} from 'twitter-api-sdk';

class TwitterSearcher implements ISearcher {
  t: Client;

  constructor() {
    this.t = new Client(process.env.BEARER_TOKEN);
  }

  async search(keyword: string, after: number): Promise<string[]> {
    const afterIso = new Date(after).toISOString();

    const results = await this.t.tweets.tweetsRecentSearch({
      query: `${keyword} -is:retweet`,
      start_time: afterIso,
    });

    return results.data.map(item => `https://twitter.com/${item.author_id}/status/${item.id}`);
  }
}

export default TwitterSearcher;
