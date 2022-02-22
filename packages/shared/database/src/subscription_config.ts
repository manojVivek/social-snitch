import client from './client';
import {definitions} from './types';

export const ensureSubscriptionConfigExists = async (
  subscription_id,
  watch_config_id,
  notification_config_id
) => {
  return client.ensureEntityExists<definitions['subscription_config']>('subscription_config', {
    subscription_id,
    watch_config_id,
    notification_config_id,
  });
};

export const getSubscriptionConfig = async (query: Partial<definitions['subscription_config']>) => {
  return client.getEntity<definitions['subscription_config']>('subscription_config', query);
};

export const getSubscriptionConfigs = async (
  query: Partial<definitions['subscription_config']>
) => {
  return client.getEntities<definitions['subscription_config']>('subscription_config', query);
};

export const getSubscriptionConfigsForWatchConfigId = async (watch_config_id: number) => {
  return getSubscriptionConfigs({watch_config_id});
};
