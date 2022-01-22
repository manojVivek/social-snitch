import 'dotenv/config';
import Eris from 'eris';

const Constants = Eris.Constants;
const bot = Eris(process.env.DISCORD_BOT_TOKEN);

const registerCommands = (bot: Eris.Client) => {
  return bot.createCommand({
    name: 'socialsnitch',
    description: 'Manage alert subscriptions',
    type: Constants.ApplicationCommandTypes.CHAT_INPUT,
    options: [
      {
        name: 'operation',
        type: Constants.ApplicationCommandOptionTypes.STRING,
        required: true,
        choices: [
          {name: 'Subscribe', value: 'subscribe'},
          {name: 'Unsubscribe', value: 'unsubscribe'},
        ],
        description: 'subscribe or unsubscribe for keywords',
      },
      {
        name: 'platform',
        type: Constants.ApplicationCommandOptionTypes.STRING,
        required: true,
        choices: [{name: 'HackerNews', value: 'hackernews'}],
        description: 'Social media platform to keep tab of',
      },
      {
        name: 'keywords',
        type: Constants.ApplicationCommandOptionTypes.STRING,
        required: true,
        description: 'comma separated keywords to subscribe/unsubscribe',
      },
    ],
  });
};

bot.on('ready', async () => {
  console.log('Ready!');
  try {
    await registerCommands(bot);
  } catch (err) {
    console.log('Error', err);
  }
});

bot.on('error', err => {
  console.error(err);
});

bot.connect();

bot.on('interactionCreate', interaction => {
  if (interaction instanceof Eris.CommandInteraction) {
    switch (interaction.data.name) {
      case 'socialsnitch':
        console.log('interaction', interaction.channel.id, interaction.data);
        const operation = (
          interaction.data.options.find(
            o => o.name === 'operation'
          ) as Eris.InteractionDataOptionsWithValue
        ).value;
        switch (operation) {
          case 'subscribe':
            return interaction.createMessage('Subscription successful ✅');
          case 'unsubscribe':
            return interaction.createMessage('Unsubscribe successful ✅');
          default:
            return interaction.createMessage(`Unknown operation: ${operation}`);
        }
      default: {
        return interaction.createMessage('Unknown command');
      }
    }
  }
});
