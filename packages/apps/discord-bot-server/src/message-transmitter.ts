import {
  getNewNotificationsGroupedByNotificationConfig,
  INotification,
  markNotificationsAsTransmitted,
} from '@socialsnitch/database/src/notification';
import {
  getNotificationConfigById,
  INotificationConfig,
} from '@socialsnitch/database/src/notification_config';
import SocialSnitchDiscordClient from '@socialsnitch/discord-client';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const DEFAULT_BATCH_LENGTH = 25;
const DISCORD_MESSAGE_LENGTH_LIMIT = 2000;

export const startMessageTransmitter = async (client: SocialSnitchDiscordClient) => {
  for (;;) {
    try {
      const grouppedMessages = await getNewNotificationsGroupedByNotificationConfig();
      if (!grouppedMessages.length) {
        console.log('No new notifications, sleeping.. 😴');
        await sleep(60000);
        continue;
      }

      for (const {notification_config_id, notifications} of grouppedMessages) {
        console.log(`Processing ${notifications.length} notifications`);
        const notificationConfig = await getNotificationConfigById(notification_config_id);
        let currentBatch = [];
        let batchLength = DEFAULT_BATCH_LENGTH;
        for (const notification of notifications) {
          if (notification.content.length + batchLength > DISCORD_MESSAGE_LENGTH_LIMIT) {
            await transmitNotifications(currentBatch, client, notificationConfig);
            currentBatch = [];
            batchLength = DEFAULT_BATCH_LENGTH;
          }
          currentBatch.push(notification);
          batchLength += notification.content.length + 5;
        }
        if (currentBatch.length) {
          await transmitNotifications(currentBatch, client, notificationConfig);
        }

        console.log(`Processing ${notifications.length} notifications ...Done`);
      }
    } catch (err) {
      console.error('Error while transmitting message', err);
    }
  }
};

async function transmitNotifications(
  notifications: INotification[],
  client: SocialSnitchDiscordClient,
  notificationConfig: INotificationConfig
) {
  const message = `New social mentions:\n${notifications
    .map(({content}, idx) => `${idx + 1}. ${content}`)
    .join('\n')}`;
  await sendNotification(client, notificationConfig, message);
  await markNotificationsAsTransmitted(notifications.map(({id}) => id));
}

const sendNotification = (client, notificationConfig, message) => {
  return client.sendMessageToChannel(notificationConfig.discord_channel_id, message);
};