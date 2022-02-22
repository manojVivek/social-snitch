import client from './client';
import {NOTIFICATION_STATUS} from './constants';
import {definitions} from './types';

export const createNotification = async (subscription_config_id: number, content: string) => {
  return client.insertEntity<definitions['notification']>('notification', {
    subscription_config_id,
    content,
    status: NOTIFICATION_STATUS.NEW,
  });
};

export const getNotification = async (query: Partial<definitions['notification']>) => {
  return client.getEntity<definitions['notification']>('notification', query);
};
