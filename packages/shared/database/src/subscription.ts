import client from './client';
import {definitions} from './types';
import Bluebird from 'bluebird';
import {
  ensureWatchConfigExist,
  getWatchConfigBySocialPlatformAndKeyword,
  getWatchConfigsByIds,
} from './watch_config';
import {NOTIFICATION_PLATFORMS, SOCIAL_PLATFORMS, SOCIAL_PLATFORMS_BY_ID} from './constants';
import {
  deleteSubscriptionConfig,
  ensureSubscriptionConfigExists,
  getSubscriptionConfigsForSubscriptionId,
} from './subscription_config';
import {ensureUserExists, getUserByUsername} from './user';
import {ensureNotificationConfigExists} from './notification_config';

type ICreateSubscriptionOptionsSubscriptions = {[key: string]: string[]};
interface ICreateSubscriptionOptionsNotificationConfig {
  channelId: string;
}

export const createSubscription = async (
  username: string,
  subscriptions: ICreateSubscriptionOptionsSubscriptions,
  nofiticationConfig: ICreateSubscriptionOptionsNotificationConfig
) => {
  console.log('Creating Subscription for user:', username, subscriptions);
  const user = await ensureUserExists(username);
  console.log('Ensuring user exists ...Done');
  const user_id = user.id;

  const notificationConfig = await ensureNotificationConfigExists(
    user_id,
    NOTIFICATION_PLATFORMS.DISCORD.id,
    nofiticationConfig.channelId
  );
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
  await Bluebird.map(Object.entries(subscriptions), async ([platform, keywords]) => {
    console.log('Creating Subscription Config for platform:', JSON.stringify(platform), keywords);
    const socialPlatform = SOCIAL_PLATFORMS[platform];
    await Bluebird.map(keywords, async keyword => {
      const watchConfig = await ensureWatchConfigExist(socialPlatform, keyword);
      return ensureSubscriptionConfigExists(subscription.id, watchConfig.id, notificationConfig.id);
    });
  });
  console.log('Creating Subscription for user:', username, '...Done');
};

export const removeSubscription = async (
  username: string,
  subscriptions: ICreateSubscriptionOptionsSubscriptions
) => {
  console.log('Removing Subscription for user:', username);
  const subscriptionConfigs = await getAllSubscriptionConfigsByUsername(username);
  const watchConfigCriterias = Object.keys(subscriptions)
    .map(platform => {
      const keywords = subscriptions[platform];
      return keywords.map(keyword => ({keyword, platform: SOCIAL_PLATFORMS[platform]}));
    })
    .reduce((acc, curr) => acc.concat(curr), []);
  const watchConfigs = (
    await Bluebird.map(watchConfigCriterias, async ({platform, keyword}) => {
      return getWatchConfigBySocialPlatformAndKeyword(platform, keyword);
    })
  ).filter(Boolean);
  const watchConfigIds = watchConfigs.map(watchConfig => watchConfig.id);
  const subscriptionConfigsToDelete = subscriptionConfigs.filter(subscriptionConfig => {
    return watchConfigIds.includes(subscriptionConfig.watch_config_id);
  });
  await Bluebird.map(subscriptionConfigsToDelete, async subscriptionConfig => {
    return deleteSubscriptionConfig(subscriptionConfig.id);
  });
  await reapSubscriptionIfNeeded(subscriptionConfigs[0].subscription_id);
  console.log('Removing Subscription for user:', username, '...Done');
};

const reapSubscriptionIfNeeded = async (subscription_id: number) => {
  const remainingSubscriptionConfigsForSubscription = await getSubscriptionConfigsForSubscriptionId(
    subscription_id
  );
  if (remainingSubscriptionConfigsForSubscription.length > 0) {
    return;
  }
  await deleteSubscriptionEntityById(subscription_id);
};

const getAllSubscriptionConfigsByUsername = async (username: string) => {
  const user = await getUserByUsername(username);
  const user_id = user.id;
  const subscription = await getSubscriptionByUserId(user_id);
  const subscription_id = subscription.id;
  const subscriptionConfigs = await getSubscriptionConfigsForSubscriptionId(subscription_id);
  return subscriptionConfigs;
};

const getSubscription = async (query: Partial<definitions['subscription']>) => {
  return client.getEntity<definitions['subscription']>('subscription', query);
};

export const getSubscriptionByUserId = async (user_id: number) => {
  return getSubscription({user_id});
};

export const getSubscriptionDataByUsername = async (username: string) => {
  console.log('Getting Subscription Data for user:', username);
  const subscriptionConfigs = await getAllSubscriptionConfigsByUsername(username);
  const watchConfigs = await getWatchConfigsByIds(
    subscriptionConfigs.map(subscriptionConfig => subscriptionConfig.watch_config_id)
  );
  const subscriptionData: ICreateSubscriptionOptionsSubscriptions = watchConfigs
    .map(({keyword, social_platform_id}) => ({keyword, social_platform_id}))
    .reduce((acc, {keyword, social_platform_id}) => {
      const platform = SOCIAL_PLATFORMS_BY_ID[social_platform_id];
      if (!acc[platform.name]) {
        acc[platform.name] = [];
      }
      acc[platform.name].push(keyword);
      return acc;
    }, {});
  console.log('Getting Subscription Data for user:', username, '...Done');
  return subscriptionData;
};

const deleteSubscriptionEntityById = async (id: number) => {
  return client.deleteEntities<definitions['subscription']>('subscription', {id});
};