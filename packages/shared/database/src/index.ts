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

export const updateDiscordSubscription = async (id, fields) => {
  const {data, error} = await client
    .from<definitions['discord_subscriptions']>('discord_subscriptions')
    .update(fields)
    .match({id});
  if (error) {
    console.error(error);
    throw error;
  }
  return data;
};

export const addMessageToDiscordQueue = async (message, channel_id) => {
  const {data, error} = await client
    .from<definitions['discord_message_queue']>('discord_message_queue')
    .insert({
      message,
      channel_id,
      status: 'PENDING',
    });
  if (error) {
    console.error(error);
    throw error;
  }
  return data;
};
