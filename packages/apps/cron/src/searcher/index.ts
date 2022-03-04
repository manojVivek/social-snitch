import {SOCIAL_PLATFORMS} from '@socialsnitch/database/src/constants';
import {IWatchConfig} from '@socialsnitch/database/src/watch_config';
import HackerNewsSearcher from './hn-searcher';

export interface ISearcher {
  search(keyword: string, after: number): Promise<string[]>;
}

const searchers: {[key: number]: ISearcher} = {
  [SOCIAL_PLATFORMS.HACKER_NEWS.id]: new HackerNewsSearcher(),
};

const searchForUpdates = async (watchConfig: IWatchConfig) => {
  const {keyword, social_platform_id, last_run_at} = watchConfig;
  const after = Math.floor(new Date(last_run_at).getTime() / 1000);
  return searchers[social_platform_id].search(keyword, after);
};

export default searchForUpdates;
