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
    .update({...fields, updated_at: 'now()'})
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

const getAPendingDiscordQueueMessage = async () => {
  const {data, error} = await client
    .from<definitions['discord_message_queue']>('discord_message_queue')
    .select('id')
    .eq('status', 'PENDING')
    .limit(1);
  if (error) {
    throw error;
  }
  if (!data || data.length === 0) {
    return null;
  }
  const {id} = data[0];
  return id;
};

const markMessagePickedForTransmitting = async id => {
  const {data, error} = await client
    .from<definitions['discord_message_queue']>('discord_message_queue')
    .update({status: 'TRANSMITTING', updated_at: 'now()'})
    .eq('id', id)
    .eq('status', 'PENDING');
  if (error) {
    throw error;
  }
  return data[0];
};

export const getADiscordMessageFromQueueForTransmission = async () => {
  try {
    const id = await getAPendingDiscordQueueMessage();
    if (!id) {
      return null;
    }
    const data = await markMessagePickedForTransmitting(id);
    if (!data) {
      // the message was already picked for transmission
      return getADiscordMessageFromQueueForTransmission();
    }
    return data;
  } catch (err) {
    console.error('Error while fetching a message for transmitting, but ignoring', err);
    return null;
  }
};

export const setDiscordMessageTransmitted = async id => {
  const {data, error} = await client
    .from<definitions['discord_message_queue']>('discord_message_queue')
    .update({status: 'DONE', updated_at: 'now()'})
    .eq('id', id);
  if (error) {
    throw error;
  }
  return data;
};