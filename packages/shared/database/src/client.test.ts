import {createSubscription} from './subscription';

createSubscription(
  'discord:934310548575772692',
  {HACKER_NEWS: ['show hn', 'responsively']},
  {channelId: '934310548575772692'}
).catch(console.error);
