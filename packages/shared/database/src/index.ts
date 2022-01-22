import client from './client';
import {definitions} from './types';

export const getAllDiscordSubscriptions = async () => {
  const {data, error} = await client
    .from<definitions['discord_subscriptions']>('discord_subscriptions')
    .select();
  console.log('data', data);
  return data;
};
