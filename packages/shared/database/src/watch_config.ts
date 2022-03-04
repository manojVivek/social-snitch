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

export const getWatchConfigBySocialPlatformAndKeyword = async (
  platform: ISocialPlatform,
  keyword: string
) => {
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

export const deleteWatchConfig = async (id: number) => {
  const data = await client.deleteEntities<definitions['watch_config']>('watch_config', {id});
  return data;
};

export const getWatchConfigsByIds = async (ids: number[]) => {
  const {data, error} = await client
    .from<definitions['watch_config']>('watch_config')
    .select()
    .in('id' as any, ids);
  if (error) {
    throw error;
  }
  return data;
};

export type IWatchConfig = definitions['watch_config'];