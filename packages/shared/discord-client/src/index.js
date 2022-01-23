"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Eris = void 0;
const eris_1 = __importDefault(require("eris"));
const Constants = eris_1.default.Constants;
class SocialSnitchDiscordClient extends eris_1.default.Client {
    constructor(token) {
        super(token);
        this.registerSlashCommands = () => {
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
                            { name: 'Subscribe', value: 'subscribe' },
                            { name: 'Unsubscribe', value: 'unsubscribe' },
                        ],
                        description: 'subscribe or unsubscribe for keywords',
                    },
                    {
                        name: 'platform',
                        type: Constants.ApplicationCommandOptionTypes.STRING,
                        required: true,
                        choices: [{ name: 'HackerNews', value: 'hackernews' }],
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
        this.on('interactionCreate', interaction => {
            if (interaction instanceof eris_1.default.CommandInteraction) {
                switch (interaction.data.name) {
                    case 'socialsnitch':
                        console.log('interaction', interaction.channel.id, interaction.data);
                        const operation = interaction.data.options.find(o => o.name === 'operation').value;
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
}
exports.default = SocialSnitchDiscordClient;
exports.Eris = eris_1.default;
//# sourceMappingURL=index.js.map