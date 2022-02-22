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
  return client.getEntities<definitions['watch_config']>('watch_config', {});
};

export const updateWatchConfig = async (id, watch_config: Partial<definitions['watch_config']>) => {
  const data = await client.updateEntities<definitions['watch_config']>(
    'watch_config',
    {id},
    watch_config
  );
  return data[0];
};