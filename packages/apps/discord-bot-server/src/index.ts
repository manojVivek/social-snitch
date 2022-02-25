import 'dotenv/config';
import DiscordClient, {EventPayload} from '@socialsnitch/discord-client';
import {startMessageTransmitter} from './message-transmitter';
import {
  createSubscription,
  getSubscriptionDataByUsername,
  removeSubscription,
} from '@socialsnitch/database/src/subscription';

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

  bot.on('subscribe', async ({channel_id, options, interaction}: EventPayload) => {
    let success = false;
    try {
      await createSubscription(
        `discord:${channel_id}`,
        {[options.platform]: options.keywords},
        {channelId: channel_id}
      );
      success = true;
    } catch (err) {
      console.log('Error while subscribing', channel_id, options.keywords, err);
    }
    await interaction.createMessage(
      success ? 'Subscription successful ✅' : 'Request failed ❌. Please try again.'
    );
  });

  bot.on('unsubscribe', async ({channel_id, options, interaction}: EventPayload) => {
    let success = false;
    try {
      await removeSubscription(`discord:${channel_id}`, {[options.platform]: options.keywords});
      success = true;
    } catch (err) {
      console.log('Error while unsubscribing', channel_id, options.keywords, err);
    }
    await interaction.createMessage(
      success ? 'Unsubscribe successful ✅' : 'Request failed ❌. Please try again.'
    );
  });

  bot.on('list-subscriptions', async ({channel_id, interaction}) => {
    try {
      const data = await getSubscriptionDataByUsername(`discord:${channel_id}`);
      if (!data || data?.keyword?.length === 0) {
        return interaction.createMessage('No active subscriptions found for this channel.');
      }
      console.log('data', data);
      const platformWiseKeywordsString = Object.keys(data)
        .map((platform, idx) => `${idx + 1}. ${platform}: \`${data[platform].join('|')}\``)
        .join('\n');
      const replyMessage = `Active keyword subscriptions:\n${platformWiseKeywordsString}`;
      await interaction.createMessage(replyMessage);
    } catch (err) {
      console.log('Error while listing subscriptions', channel_id, err);
      return;
    }
    await interaction.createMessage('Request failed ❌. Please try again.');
  });

  console.log('Connecting...');
  bot.connect().catch(err => {
    console.error('Error connecting', err);
  });
  console.log('Connecting... done');
} catch (err) {
  console.error('Error while starting the discord bot server', err);
}
