import {ISearcher} from '.';
import snoowrap from 'snoowrap';
import cld from 'cld';
import Bluebird from 'bluebird';
import {sanitizeKeyword} from '@socialsnitch/discord-client/src/utils';

const isEnglishPost = async (text: string) => {
  try {
    const {reliable, languages} = await cld.detect(text);
    if (!reliable) {
      return true;
    }
    return languages.some(l => l.code === 'en' && l.percent > 60) as boolean;
  } catch (e) {
    console.log('Error while detecting language', text, e);
    return true;
  }
};

class RedditSearcher implements ISearcher {
  r: snoowrap;

  constructor() {
    this.r = new snoowrap({
      userAgent: process.env.REDDIT_USER_AGENT,
      clientId: process.env.REDDIT_CLIENT_ID,
      clientSecret: process.env.REDDIT_CLIENT_SECRET,
      username: process.env.REDDIT_USERNAME,
      password: process.env.REDDIT_PASSWORD,
    });
    this.r.config({debug: true});
  }

  async search(keyword: string, after: number): Promise<string[]> {
    const afterEpochSecs = Math.floor(after / 1000);
    const allResults = await this.r.search({
      query: keyword,
      sort: 'new',
      time: 'all',
      syntax: 'lucene',
    });
    const results = await Bluebird.filter(allResults, async result => {
      const sanitizedKeyword = sanitizeKeyword(keyword);
      // Time filter
      if (result.created_utc < afterEpochSecs) {
        return false;
      }

      // Exact match filter
      const textContent = `${result.title} ${result.selftext}`;
      if (textContent.toLowerCase().indexOf(sanitizedKeyword) === -1) {
        return false;
      }

      // Language filter
      if (sanitizedKeyword !== 'parca') {
        return true;
      }
      return isEnglishPost(textContent);
    });
    return results.map(({permalink}) => `https://reddit.com${permalink}`);
  }
}

export default RedditSearcher;
