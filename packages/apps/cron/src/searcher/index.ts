import {SOCIAL_PLATFORMS} from '@socialsnitch/database/src/constants';
import {IWatchConfig} from '@socialsnitch/database/src/watch_config';
import HackerNewsSearcher from './hn-searcher';
import RedditSearcher from './reddit-searcher';

export interface ISearcher {
  search(keyword: string, after: number): Promise<string[]>;
}

const searchers: {[key: number]: ISearcher} = {
  [SOCIAL_PLATFORMS.HACKER_NEWS.id]: new HackerNewsSearcher(),
  [SOCIAL_PLATFORMS.REDDIT.id]: new RedditSearcher(),
};

const searchForUpdates = async (watchConfig: IWatchConfig) => {
  const {keyword, social_platform_id, last_run_at} = watchConfig;
  return searchers[social_platform_id].search(keyword, new Date(last_run_at).getTime());
};

export default searchForUpdates;
