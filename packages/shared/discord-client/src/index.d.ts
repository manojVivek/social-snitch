import _Eris from 'eris';
declare class SocialSnitchDiscordClient extends _Eris.Client {
    constructor(token: string);
    registerSlashCommands: () => Promise<_Eris.ApplicationCommand<2 | 1 | 3>>;
}
export default SocialSnitchDiscordClient;
export declare const Eris: typeof _Eris;
