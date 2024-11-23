export interface ISocialPlatform {
  id: number;
  name: string;
  key: string;
}

export interface INotificationPlatform {
  id: number;
  name: string;
}

export const SOCIAL_PLATFORMS: {[key: string]: ISocialPlatform} = {
  HACKER_NEWS: {
    id: 1,
    name: 'HackerNews',
    key: 'HACKER_NEWS',
  },
  REDDIT: {
    id: 2,
    name: 'Reddit',
    key: 'REDDIT',
  },
  TWITTER: {
    id: 3,
    name: 'Twitter',
    key: 'TWITTER',
  },
  BLUESKY: {
    id: 4,
    name: 'Bluesky',
    key: 'BLUESKY',
  }
};

export const SOCIAL_PLATFORMS_BY_ID: {[key: number]: ISocialPlatform} = Object.keys(
  SOCIAL_PLATFORMS
).reduce((acc, item) => {
  const platform = SOCIAL_PLATFORMS[item];
  acc[platform.id] = platform;
  return acc;
}, {});

export const NOTIFICATION_PLATFORMS: {[key: string]: INotificationPlatform} = {
  DISCORD: {
    id: 1,
    name: 'Discord',
  },
};

export const NOTIFICATION_STATUS = {
  NEW: 'NEW',
  TRANSMITTED: 'TRANSMITTED',
};

export type INotificationStatus = typeof NOTIFICATION_STATUS[keyof typeof NOTIFICATION_STATUS];
