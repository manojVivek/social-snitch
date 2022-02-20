import client from './client';
import {definitions} from './types';

export const updateSubscriptionConfig = async (subscription_id, watch_config_id) => {
  let subscriptionConfig = await getSubscriptionConfig({subscription_id, watch_config_id});
  if (!subscriptionConfig) {
    subscriptionConfig = await client.insertEntity<definitions['subscription_config']>(
      'subscription_config',
      {
        subscription_id,
        watch_config_id,
      }
    );
  }
  return subscriptionConfig;
};

export const getSubscriptionConfig = async (query: Partial<definitions['subscription_config']>) => {
  return client.getEntity<definitions['subscription_config']>('subscription_config', query);
};
