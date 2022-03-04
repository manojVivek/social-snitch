import client from './client';
import {NOTIFICATION_STATUS} from './constants';
import {definitions} from './types';

export const createNotification = async (notification_config_id: number, content: string) => {
  return client.insertEntity<definitions['notification']>('notification', {
    notification_config_id: notification_config_id,
    content,
    status: NOTIFICATION_STATUS.NEW,
  });
};

export const getNotification = async (query: Partial<definitions['notification']>) => {
  return client.getEntity<definitions['notification']>('notification', query);
};

export const getNewNotificationsGroupedByNotificationConfig = async () => {
  // TODO: Revisit and implement a better way to do this
  const notifications = await client.getEntities<definitions['notification']>('notification', {
    status: NOTIFICATION_STATUS.NEW,
  });
  const groupedNotifications: {
    [key: number]: {notification_config_id: number; notifications: definitions['notification'][]};
  } = notifications.reduce((acc, notification) => {
    if (!acc[notification.notification_config_id]) {
      acc[notification.notification_config_id] = {
        notification_config_id: notification.notification_config_id,
        notifications: [],
      };
    }
    if (
      !acc[notification.notification_config_id].notifications.find(
        n => n.content === notification.content
      )
    ) {
      acc[notification.notification_config_id].notifications.push(notification);
    }
    return acc;
  }, {});
  return Object.values(groupedNotifications);
};

export const markNotificationsAsTransmitted = async (ids: number[]) => {
  const {data, error} = await client
    .from<definitions['notification']>('notification')
    .update({status: NOTIFICATION_STATUS.TRANSMITTED, updated_at: new Date().toISOString()})
    .in('id', ids);
  if (error) {
    throw error;
  }
  return data;
};
