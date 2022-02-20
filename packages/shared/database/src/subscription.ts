import client from './client';
import {definitions} from './types';
import Bluebird from 'bluebird';
import {ensureWatchConfigExist} from './watch_config';
import {NOTIFICATION_PLATFORMS, SOCIAL_PLATFORMS} from './constants';
import {ensureSubscriptionConfigExists} from './subscription_config';
import {ensureUserExists} from './user';
import {ensureNotificationConfigExists} from './notification_config';

export const createSubscription = async (username, subscriptions, nofiticationConfig) => {
  console.log('Ensuring user exists');
  const user = await ensureUserExists(username);
  console.log('Ensuring user exists ...Done');
  const user_id = user.id;

  console.log('Ensuring notification config exists');
  const notificationConfig = await ensureNotificationConfigExists(
    user_id,
    NOTIFICATION_PLATFORMS.DISCORD.id,
    nofiticationConfig
  );
  console.log('Ensuring notification config exists ...Done');

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
        return ensureSubscriptionConfigExists(
          subscription.id,
          watchConfig.id,
          notificationConfig.id
        );
      });

      console.log('subscriptionConfigs', subscriptionConfigs);
    }
  );

  console.log('Promises', promises);

  console.log('Updating Subscription');
  console.log('Updating Subscription ...Done');
};
