import _Eris from 'eris';

const Constants = _Eris.Constants;

class SocialSnitchDiscordClient extends _Eris.Client {
  constructor(token: string) {
    super(token);
    this.on('interactionCreate', interaction => {
      if (interaction instanceof _Eris.CommandInteraction) {
        switch (interaction.data.name) {
          case 'socialsnitch':
            console.log('interaction', interaction.channel.id, interaction.data);
            const operation = (
              interaction.data.options.find(
                o => o.name === 'operation'
              ) as _Eris.InteractionDataOptionsWithValue
            ).value;
            switch (operation) {
              case 'subscribe':
                return this.emit('subscribe', interaction);
              case 'unsubscribe':
                this.emit('unsubscribe', interaction);
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
  }

  registerSlashCommands = () => {
    return this.createCommand({
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
}

export default SocialSnitchDiscordClient;
export const Eris = _Eris;
