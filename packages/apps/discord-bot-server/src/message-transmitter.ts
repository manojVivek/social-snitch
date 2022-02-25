import {
  getNewNotificationsGroupedByNotificationConfig,
  markNotificationsAsTransmitted,
} from '@socialsnitch/database/src/notification';
import {getNotificationConfigById} from '@socialsnitch/database/src/notification_config';
import SocialSnitchDiscordClient from '@socialsnitch/discord-client';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const startMessageTransmitter = async (client: SocialSnitchDiscordClient) => {
  for (;;) {
    try {
      const grouppedMessages = await getNewNotificationsGroupedByNotificationConfig();
      if (!grouppedMessages.length) {
        await sleep(60000);
        continue;
      }
      for (const {notification_config_id, notifications} of grouppedMessages) {
        const notificationConfig = await getNotificationConfigById(notification_config_id);
        const message = `New HackerNews mentions:\n${notifications
          .map(({content}, idx) => `${idx + 1}. ${content}`)
          .join('\n')}`;
        await sendNotification(client, notificationConfig, message);
        await markNotificationsAsTransmitted(notifications.map(({id}) => id));
      }
    } catch (err) {
      console.error('Error while transmitting message', err);
    }
  }
};

const sendNotification = (client, notificationConfig, message) => {
  client.sendMessageToChannel(notificationConfig.channelId, message);
};
