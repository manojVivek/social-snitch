import client from './client';
import {definitions} from './types';
import Bluebird from 'bluebird';
import {ensureWatchConfigExist} from './watch_config';
import {SOCIAL_PLATFORMS} from './constants';
import {updateSubscriptionConfig} from './subscription_config';

export const createSubscription = async (user_id, subscriptions, nofiticationConfig) => {
  console.log('Creating subscription', user_id, subscriptions);
  let subscription = await client.getEntity<definitions['subscription']>('subscription', {
    user_id,
  });
  if (!subscription) {
    console.log('Creating Subscription');
    subscription = await client.insertEntity<definitions['subscription']>('subscription', {
      user_id,
    });
    console.log('Creating Subscription ...Done');
  }
  console.log('Subscription', subscription);
  const promises = await Bluebird.map(
    Object.entries(subscriptions),
    async ([platform, keywords]) => {
      const socialPlatform = SOCIAL_PLATFORMS[platform];
      const subscriptionConfigs = await Bluebird.map(keywords, async keyword => {
        const watchConfig = await ensureWatchConfigExist(socialPlatform, keyword);
        return updateSubscriptionConfig(subscription.id, watchConfig.id);
      });

      console.log('subscriptionConfigs', subscriptionConfigs);
    }
  );

  console.log('Promises', promises);

  console.log('Updating Subscription');
  console.log('Updating Subscription ...Done');
};
