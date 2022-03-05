import client from './client';
import {definitions} from './types';

export type INotificationConfig = definitions['notification_config'];

const postProcessNotificationConfig = notification => {
  if (typeof notification.config === 'string') {
    notification.config = JSON.parse(notification.config);
  }
  return notification;
};

export const ensureNotificationConfigExists = async (
  user_id: number,
  notification_platform_id: number,
  discord_channel_id: string
) => {
  return postProcessNotificationConfig(
    await client.ensureEntityExists<definitions['notification_config']>('notification_config', {
      user_id,
      notification_platform_id,
      discord_channel_id,
    })
  );
};

export const createNotificationConfig = async (
  user_id: number,
  notification_platform_id: number,
  discord_channel_id: string
) => {
  return postProcessNotificationConfig(
    await client.insertEntity<definitions['notification_config']>('notification_config', {
      user_id,
      notification_platform_id,
      discord_channel_id,
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