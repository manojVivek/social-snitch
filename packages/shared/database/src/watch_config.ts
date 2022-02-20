import client from './client';
import {ISocialPlatform} from './constants';
import {definitions} from './types';

export const ensureWatchConfigExist = async (platform: ISocialPlatform, keyword: string) => {
  return client.ensureEntityExists<definitions['watch_config']>('watch_config', {
    keyword,
    social_platform_id: platform.id,
  });
};

export const createWatchConfig = async (platform: ISocialPlatform, keyword: string) => {
  return client.insertEntity<definitions['watch_config']>('watch_config', {
    keyword,
    social_platform_id: platform.id,
  });
};

export const getWatchConfig = async (platform: ISocialPlatform, keyword: string) => {
  return client.getEntity<definitions['watch_config']>('watch_config', {
    keyword,
    social_platform_id: platform.id,
  });
};

export const getAllWatchConfigs = async () => {
  return client.getAllEntities<definitions['watch_config']>('watch_config', {});
};
