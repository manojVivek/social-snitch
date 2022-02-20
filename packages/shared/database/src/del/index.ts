import client from '../client';
import {definitions} from '../types';

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

const getEntity = async <Type>(tableName: string, query: Record<string, string>): Promise<Type> => {
  const {data, error} = await client.from<Type>(tableName).select().match(query).maybeSingle();
  if (error) {
    console.error(error);
    throw error;
  }
  return data;
};

const insertEntity = async <Type>(tableName: string, entity: Partial<Type>): Promise<Type> => {
  const {data, error} = await client.from<Type>(tableName).insert(entity);
  if (error) {
    throw error;
  }
  return data[0];
};

export const getSubscriptionByChannelId = async channelId => {
  return getEntity<definitions['discord_subscriptions']>('discord_subscriptions', {
    channel_id: channelId,
  });
};

const appendKeywordToSubscription = async (prevData, newKeywords) => {
  const {data, error} = await client
    .from<definitions['discord_subscriptions']>('discord_subscriptions')
    .update({
      keyword: toPostgresArrayLiteral(Array.from(new Set([...prevData.keyword, ...newKeywords]))),
      updated_at: 'now()',
    })
    .eq('id', prevData.id)
    .eq('keyword', toPostgresArrayLiteral(prevData.keyword));
  if (error) {
    throw error;
  }
  return data[0];
};

export const addDiscordSubscription = async (channel_id: string, newKeywords: string[]) => {
  console.log('Adding new subscription', channel_id, newKeywords);
  let updatedData = null;
  do {
    let existingData = await getEntity<definitions['discord_subscriptions']>(
      'discord_subscriptions',
      {
        channel_id,
      }
    );
    if (!existingData) {
      console.log('Inserting new channel subscription');
      return insertEntity<definitions['discord_subscriptions']>('discord_subscriptions', {
        channel_id,
        keyword: newKeywords,
      });
    }
    console.log('Appending keywords to existing channel subscription');
    updatedData = await appendKeywordToSubscription(existingData, newKeywords);
  } while (!updatedData);
  return updatedData;
};

const removeKeywordsFromSubscription = async (prevData, keywordsToRm) => {
  const {data, error} = await client
    .from<definitions['discord_subscriptions']>('discord_subscriptions')
    .update({
      keyword: toPostgresArrayLiteral(
        prevData.keyword.filter(keyword => !keywordsToRm.includes(keyword))
      ),
      updated_at: 'now()',
    })
    .eq('id', prevData.id)
    .eq('keyword', toPostgresArrayLiteral(prevData.keyword));
  if (error) {
    throw error;
  }
  return data[0];
};

export const removeDiscordSubscription = async (channel_id, keywordsToRm: string[]) => {
  const existingData = await getEntity<definitions['discord_subscriptions']>(
    'discord_subscriptions',
    {
      channel_id,
    }
  );
  if (!existingData) {
    console.log('No subscriptions found for the channel, so returning.');
    return;
  }
  console.log('Removing keywords to from channel subscription');
  return removeKeywordsFromSubscription(existingData, keywordsToRm);
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

export const toPostgresArrayLiteral = (array: string[]): unknown[] => {
  return `{${array.join(', ')}}` as unknown as unknown[];
};
