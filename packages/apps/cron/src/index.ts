import bluebird from 'bluebird';
import {createNotification} from '@socialsnitch/database/src/notification';
import {getSubscriptionConfigsForWatchConfigId} from '@socialsnitch/database/src/subscription_config';
import {getAllWatchConfigs, updateWatchConfig} from '@socialsnitch/database/src/watch_config';
import {SOCIAL_PLATFORMS_BY_ID} from '@socialsnitch/database/src/constants';
import 'dotenv/config';
import searchForUpdates from './searcher';

async function main() {
  const watchConfigs = await getAllWatchConfigs();
  for (const watchConfig of watchConfigs) {
    const platform = SOCIAL_PLATFORMS_BY_ID[watchConfig.social_platform_id];
    const platformName = platform ? platform.name : `Platform ${watchConfig.social_platform_id}`;
    console.log('Getting updates for', `'${watchConfig.keyword}'`, `on ${platformName}`);
    const currentTime = new Date().toISOString();
    const results = await searchForUpdates(watchConfig);
    if (results.length === 0) {
      console.log('No new updates for', `'${watchConfig.keyword}'`, `on ${platformName}`);
      await updateWatchConfig(watchConfig.id, {last_run_at: currentTime});
      continue;
    }
    console.log('Found', results.length, 'new updates for', `'${watchConfig.keyword}'`, `on ${platformName}`);
    const subscriptionConfigs = await getSubscriptionConfigsForWatchConfigId(watchConfig.id);
    for (const subscriptionConfig of subscriptionConfigs) {
      const {notification_config_id} = subscriptionConfig;
      await bluebird.map(results, result => createNotification(notification_config_id, result, watchConfig.keyword));
    }
    await updateWatchConfig(watchConfig.id, {last_run_at: currentTime});
    console.log('Getting updates for', `'${watchConfig.keyword}'`, `on ${platformName}`, '...Done');
  }
}

main();
