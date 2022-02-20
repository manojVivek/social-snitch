export interface ISocialPlatform {
  id: number;
  name: string;
}

export interface INotificationPlatform {
  id: number;
  name: string;
}

export const SOCIAL_PLATFORMS: {[key: string]: ISocialPlatform} = {
  HACKER_NEWS: {
    id: 1,
    name: 'HackerNews',
  },
  REDDIT: {
    id: 2,
    name: 'Reddit',
  },
};

export const NOTIFICATION_PLATFORMS: {[key: string]: INotificationPlatform} = {
  DISCORD: {
    id: 1,
    name: 'Discord',
  },
};
