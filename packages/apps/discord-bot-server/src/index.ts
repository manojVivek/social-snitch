import 'dotenv/config';
import DiscordClient from '@socialsnitch/discord-client';

const bot = new DiscordClient(process.env.DISCORD_BOT_TOKEN);

bot.on('ready', async () => {
  console.log('Ready!');
  try {
    await bot.registerSlashCommands();
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

bot.connect();
