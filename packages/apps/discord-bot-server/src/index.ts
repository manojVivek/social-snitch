import 'dotenv/config';
import DiscordClient from '@socialsnitch/discord-client';
import {startMessageTransmitter} from './message-transmitter';
import {addDiscordSubscription, removeDiscordSubscription} from '@socialsnitch/database';

try {
  console.log('Starting...');
  const bot = new DiscordClient(process.env.DISCORD_BOT_TOKEN);

  bot.on('ready', async () => {
    console.log('Ready!');
    try {
      await bot.registerSlashCommands();
      startMessageTransmitter(bot);
    } catch (err) {
      console.log('Error', err);
    }
  });

  bot.on('error', err => {
    console.error(err);
  });

  bot.on('subscribe', async ({channel_id, options, interaction}) => {
    let success = false;
    try {
      await addDiscordSubscription(channel_id, options.keywords);
      success = true;
    } catch (err) {
      console.log('Error while subscribing', channel_id, options.keywords, err);
    }
    return interaction.createMessage(
      success ? 'Subscription successful ✅' : 'Request failed ❌. Please try again.'
    );
  });

  bot.on('unsubscribe', async ({channel_id, options, interaction}) => {
    let success = false;
    try {
      await removeDiscordSubscription(channel_id, options.keywords);
      success = true;
    } catch (err) {
      console.log('Error while unsubscribing', channel_id, options.keywords, err);
    }
    return interaction.createMessage(
      success ? 'Unsubscribe successful ✅' : 'Request failed ❌. Please try again.'
    );
  });

  console.log('Connecting...');
  bot.connect().catch(err => {
    console.error('Error connecting', err);
  });
  console.log('Connecting... done');
} catch (err) {
  console.error('Error while starting the discord bot server', err);
}
