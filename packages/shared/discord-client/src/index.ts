import _Eris from 'eris';
import {parseOptions} from './utils';

const Constants = _Eris.Constants;

class SocialSnitchDiscordClient extends _Eris.Client {
  constructor(token: string) {
    super(token);
    this.on('interactionCreate', interaction => {
      if (interaction instanceof _Eris.CommandInteraction) {
        const {
          channel: {id: channel_id},
          data: {options: optionsArray},
        } = interaction;
        const options = parseOptions(optionsArray);
        switch (interaction.data.name) {
          case 'socialsnitch-subscribe':
            return this.emit('subscribe', {
              interaction,
              channel_id,
              options,
            });
          case 'socialsnitch-unsubscribe':
            return this.emit('unsubscribe', {
              interaction,
              channel_id,
              options,
            });
          case 'socialsnitch-list-subscriptions':
            return this.emit('list-subscriptions', {
              interaction,
              channel_id,
            });
          default: {
            return interaction.createMessage('Unknown command');
          }
        }
      }
    });
  }

  registerSlashCommands = async () => {
    const commonOptions = [
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
        description: `A '|' separated list of keywords to subscribe/unsubscribe`,
      },
    ];
    return Promise.all([
      this.createCommand({
        name: 'socialsnitch-subscribe',
        description: 'Add keyword subscription to this channel.',
        type: Constants.ApplicationCommandTypes.CHAT_INPUT,
        options: commonOptions,
      }),
      this.createCommand({
        name: 'socialsnitch-unsubscribe',
        description: 'Remove keyword subscription from this channel.',
        type: Constants.ApplicationCommandTypes.CHAT_INPUT,
        options: commonOptions,
      }),
      this.createCommand({
        name: 'socialsnitch-list-subscriptions',
        description: 'List all current keyword subscriptions for this channel.',
        type: Constants.ApplicationCommandTypes.CHAT_INPUT,
      }),
    ]);
  };

  sendMessageToChannel = (channelId: string, message: string) => {
    return this.createMessage(channelId, message);
  };
}

export default SocialSnitchDiscordClient;
export const Eris = _Eris;
