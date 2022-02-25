import Bluebird from 'bluebird';
import client from './client';
import {definitions} from './types';
import {deleteWatchConfig} from './watch_config';

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

const getSubscriptionConfig = async (query: Partial<definitions['subscription_config']>) => {
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

export const getSubscriptionConfigById = async (id: number) => {
  return getSubscriptionConfig({id});
};

export const getSubscriptionConfigsForSubscriptionId = async (subscription_id: number) => {
  return getSubscriptionConfigs({subscription_id});
};

export const deleteSubscriptionConfig = async (id: number) => {
  const deletedItems = await client.deleteEntities<definitions['subscription_config']>(
    'subscription_config',
    {id}
  );
  await Bluebird.map(deletedItems, async subscriptionConfig => {
    const {watch_config_id} = subscriptionConfig;
    const subscriptionConfigs = await getSubscriptionConfigsForWatchConfigId(watch_config_id); 
    if (subscriptionConfigs.length > 0) {
      return;
    }
    await deleteWatchConfig(watch_config_id);
  });
};
