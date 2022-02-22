import bluebird from 'bluebird';
import {SOCIAL_PLATFORMS} from '@socialsnitch/database/src/constants';
import {createNotification} from '@socialsnitch/database/src/notification';
import {getSubscriptionConfigsForWatchConfigId} from '@socialsnitch/database/src/subscription_config';
import {getAllWatchConfigs, updateWatchConfig} from '@socialsnitch/database/src/watch_config';
import 'dotenv/config';
import {searchHackerNews} from './utils/hn-search';

const searchers = {
  [SOCIAL_PLATFORMS.HACKER_NEWS.id]: searchHackerNews,
};

async function main() {
  const watchConfigs = await getAllWatchConfigs();
  for (const watchConfig of watchConfigs) {
    console.log(watchConfig);
    const {id, keyword, social_platform_id, last_run_at} = watchConfig;
    const after = Math.floor(new Date(last_run_at).getTime() / 1000);
    const currentTime = new Date().toISOString();
    const results = await searchers[social_platform_id](keyword, after);
    console.log(results.length);
    if (results.length === 0) {
      await updateWatchConfig(id, {last_run_at: currentTime});
      continue;
    }
    const subscriptionConfigs = await getSubscriptionConfigsForWatchConfigId(id);
    for (const subscriptionConfig of subscriptionConfigs) {
      const {id} = subscriptionConfig;
      await bluebird.map(results, result => createNotification(id, result));
    }
    await updateWatchConfig(id, {last_run_at: currentTime});
  }
}

main();
