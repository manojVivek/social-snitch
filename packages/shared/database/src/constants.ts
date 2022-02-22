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

export const NOTIFICATION_STATUS = {
  NEW: 'NEW',
};

export type INotificationStatus = typeof NOTIFICATION_STATUS[keyof typeof NOTIFICATION_STATUS];
