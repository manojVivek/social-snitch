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
    console.log('Getting updates for', `'${watchConfig.keyword}'`);
    const {id, keyword, social_platform_id, last_run_at} = watchConfig;
    const after = Math.floor(new Date(last_run_at).getTime() / 1000);
    const currentTime = new Date().toISOString();
    const results = await searchers[social_platform_id](keyword, after);
    if (results.length === 0) {
      console.log('No new updates for', `'${watchConfig.keyword}'`);
      await updateWatchConfig(id, {last_run_at: currentTime});
      continue;
    }
    console.log('Found', results.length, 'new updates for', `'${watchConfig.keyword}'`);
    const subscriptionConfigs = await getSubscriptionConfigsForWatchConfigId(id);
    for (const subscriptionConfig of subscriptionConfigs) {
      const {notification_config_id} = subscriptionConfig;
      await bluebird.map(results, result => createNotification(notification_config_id, result));
    }
    await updateWatchConfig(id, {last_run_at: currentTime});
    console.log('Getting updates for', `'${watchConfig.keyword}'`, '...Done');
  }
}

main();
