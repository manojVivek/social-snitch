import client from './client';
import {definitions} from './types';

export const ensureUserExists = async username => {
  return client.ensureEntityExists<definitions['user']>('user', {
    username,
  });
};

export const getUser = async (query: Partial<definitions['user']>) => {
  return client.getEntity<definitions['user']>('user', query);
};
