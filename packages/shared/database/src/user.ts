import client from './client';
import {definitions} from './types';

export const ensureUserExists = async username => {
  return client.ensureEntityExists<definitions['user']>('user', {
    username,
  });
};

const getUser = async (query: Partial<definitions['user']>) => {
  return client.getEntity<definitions['user']>('user', query);
};

export const getUserByUsername = async username => {
  return getUser({username});
};
