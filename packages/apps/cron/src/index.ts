import {SOCIAL_PLATFORMS} from '@socialsnitch/database/src/constants';
import {getAllWatchConfigs} from '@socialsnitch/database/src/watch_config';
import 'dotenv/config';
import {searchHackerNews} from './utils/hn-search';

const searchers = {
  [SOCIAL_PLATFORMS.HACKER_NEWS.id]: searchHackerNews,
};

async function main() {
  const watchConfigs = await getAllWatchConfigs();
  for (const watchConfig of watchConfigs) {
    console.log(watchConfig);
    const {keyword, social_platform_id, last_run_at} = watchConfig;
    const after = Math.floor(new Date(last_run_at).getTime() / 1000);
    const results = await searchers[social_platform_id](keyword, after);
    console.log(results);
  }
}

main();
