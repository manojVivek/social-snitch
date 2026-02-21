import {
  getNewNotificationsGroupedByNotificationConfig,
  getFailedToRetryNotificationsGroupedByNotificationConfig,
  INotification,
  markNotificationsAsTransmitted,
  markNotificationsAsFailedToRetry,
  markNotificationsAsFailed,
} from '@socialsnitch/database/src/notification';
import {
  getNotificationConfigById,
  INotificationConfig,
} from '@socialsnitch/database/src/notification_config';
import SocialSnitchDiscordClient from '@socialsnitch/discord-client';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const BATCH_SIZE = 25;
const DISCORD_MESSAGE_LENGTH_LIMIT = 2000;
let started = false;

function formatNotificationMessage(notifications: INotification[]): string {
  const notificationsByKeyword: {[keyword: string]: INotification[]} = {};
  notifications.forEach(notification => {
    const keyword = notification.keyword || 'Unknown';
    if (!notificationsByKeyword[keyword]) {
      notificationsByKeyword[keyword] = [];
    }
    notificationsByKeyword[keyword].push(notification);
  });

  const messageParts: string[] = [];
  Object.entries(notificationsByKeyword).forEach(([keyword, keywordNotifications]) => {
    messageParts.push(`**Keyword: ${keyword}**`);
    keywordNotifications.forEach((notification, idx) => {
      messageParts.push(`${idx + 1}. ${notification.content}`);
    });
    messageParts.push('');
  });

  return `New social mentions:\n${messageParts.join('\n')}`.trim();
}

async function transmitNotifications(
  notifications: INotification[],
  client: SocialSnitchDiscordClient,
  notificationConfig: INotificationConfig
): Promise<void> {
  const message = formatNotificationMessage(notifications);

  if (message.length <= DISCORD_MESSAGE_LENGTH_LIMIT) {
    await sendNotification(client, notificationConfig, message);
    await markNotificationsAsTransmitted(notifications.map(({id}) => id));
    return;
  }

  if (notifications.length === 1) {
    const truncated = message.substring(0, DISCORD_MESSAGE_LENGTH_LIMIT - 3) + '...';
    await sendNotification(client, notificationConfig, truncated);
    await markNotificationsAsTransmitted(notifications.map(({id}) => id));
    return;
  }

  const mid = Math.ceil(notifications.length / 2);
  await transmitNotifications(notifications.slice(0, mid), client, notificationConfig);
  await transmitNotifications(notifications.slice(mid), client, notificationConfig);
}

async function processNotificationGroup(
  notifications: INotification[],
  notificationConfigId: number,
  client: SocialSnitchDiscordClient,
  onFailure: (ids: number[]) => Promise<any>
): Promise<void> {
  const notificationConfig = await getNotificationConfigById(notificationConfigId);

  for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
    const batch = notifications.slice(i, i + BATCH_SIZE);
    try {
      await transmitNotifications(batch, client, notificationConfig);
    } catch (err) {
      console.error(
        `Error transmitting batch for notification_config_id ${notificationConfigId}:`,
        err
      );
      try {
        await onFailure(batch.map(({id}) => id));
      } catch (markErr) {
        console.error('Error marking notifications as failed:', markErr);
      }
      await sleep(10000);
    }
  }
}

export const startMessageTransmitter = async (client: SocialSnitchDiscordClient) => {
  if (started) {
    return;
  }
  started = true;

  for (;;) {
    try {
      // Phase 1: Process NEW notifications
      const newGroups = await getNewNotificationsGroupedByNotificationConfig();
      if (newGroups.length) {
        console.log('Processing NEW notifications...');
        for (const {notification_config_id, notifications} of newGroups) {
          console.log(
            `Processing ${notifications.length} NEW notifications for config ${notification_config_id}`
          );
          await processNotificationGroup(
            notifications,
            notification_config_id,
            client,
            markNotificationsAsFailedToRetry
          );
        }
      }

      // Phase 2: Process FAILED_TO_RETRY notifications
      const retryGroups = await getFailedToRetryNotificationsGroupedByNotificationConfig();
      if (retryGroups.length) {
        console.log('Processing FAILED_TO_RETRY notifications...');
        for (const {notification_config_id, notifications} of retryGroups) {
          console.log(
            `Retrying ${notifications.length} notifications for config ${notification_config_id}`
          );
          await processNotificationGroup(
            notifications,
            notification_config_id,
            client,
            markNotificationsAsFailed
          );
        }
      }

      if (!newGroups.length && !retryGroups.length) {
        console.log('No new notifications, sleeping.. 😴');
      }

      await sleep(60000);
    } catch (err) {
      console.error('Error while transmitting message', err);
      await sleep(30000);
    }
  }
};

const sendNotification = (
  client: SocialSnitchDiscordClient,
  notificationConfig: INotificationConfig,
  message: string
) => {
  return client.sendMessageToChannel(notificationConfig.discord_channel_id, message);
};
