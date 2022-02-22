import {
  getADiscordMessageFromQueueForTransmission,
  setDiscordMessageTransmitted,
} from '@socialsnitch/database/src/del';
import SocialSnitchDiscordClient from '@socialsnitch/discord-client';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const startMessageTransmitter = async (client: SocialSnitchDiscordClient) => {
  for (;;) {
    try {
      const message = await getADiscordMessageFromQueueForTransmission();
      if (!message) {
        await sleep(60000);
        continue;
      }
      const {id, channel_id, message: messageText} = message;
      console.log('Transmitting message', id);
      await client.sendMessageToChannel(channel_id, messageText);
      await setDiscordMessageTransmitted(id);
    } catch (err) {
      console.error('Error while transmitting message', err);
    }
  }
};