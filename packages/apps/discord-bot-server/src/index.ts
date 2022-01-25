import 'dotenv/config';
import DiscordClient from '@socialsnitch/discord-client';
import {startMessageTransmitter} from './message-transmitter';

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

  bot.on('subscribe', async interaction => {
    return interaction.createMessage('Subscription successful ✅');
  });

  bot.on('unsubscribe', async interaction => {
    return interaction.createMessage('Unsubscribe successful ✅');
  });

  console.log('Connecting...');
  bot.connect().catch(err => {
    console.error('Error connecting', err);
  });
  console.log('Connecting... done');
} catch (err) {
  console.error('Error while starting the discord bot server', err);
}
