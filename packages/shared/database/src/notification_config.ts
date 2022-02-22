import client from './client';
import {definitions} from './types';

const postProcessNotificationConfig = notification => {
  if (typeof notification.config === 'string') {
    notification.config = JSON.parse(notification.config);
  }
  return notification;
};

export const ensureNotificationConfigExists = async (
  user_id: number,
  notification_platform_id: number,
  config: any
) => {
  return postProcessNotificationConfig(
    await client.ensureEntityExists<definitions['notification_config']>('notification_config', {
      user_id,
      notification_platform_id,
      config: JSON.stringify(config),
    })
  );
};

export const createNotificationConfig = async (
  user_id: number,
  notification_platform_id: number,
  config: any
) => {
  return postProcessNotificationConfig(
    await client.insertEntity<definitions['notification_config']>('notification_config', {
      user_id,
      notification_platform_id,
      config: JSON.stringify(config),
    })
  );
};

const getNotificationConfig = async (query: Partial<definitions['notification_config']>) => {
  return postProcessNotificationConfig(
    await client.getEntity<definitions['notification_config']>('notification_config', query)
  );
};

export const getNotificationConfigById = async (id: number) => {
  return getNotificationConfig({id});
};