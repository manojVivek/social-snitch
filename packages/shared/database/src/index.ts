import client from './client';
import {definitions} from './types';

export const getAllDiscordSubscriptions = async () => {
  const {data, error} = await client
    .from<definitions['discord_subscriptions']>('discord_subscriptions')
    .select();
  if (error) {
    console.error(error);
    throw error;
  }
  return data;
};
