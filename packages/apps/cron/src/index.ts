import 'dotenv/config';
import {
  addMessageToDiscordQueue,
  getAllDiscordSubscriptions,
  updateDiscordSubscription,
} from '@socialsnitch/database';
import {searchHackerNews} from './utils/hn-search';

async function main() {
  const subscription = await getAllDiscordSubscriptions();
  for (const sub of subscription) {
    const currentTime = new Date().toISOString();
    const {keyword: keywords, last_run_at, channel_id} = sub;
    const results = await searchHackerNews(
      keywords,
      Math.floor(new Date(last_run_at).getTime() / 1000)
    );

    if (results.length) {
      await addMessageToDiscordQueue(
        `New HackerNews mentions:
      ${results.map((result, idx) => `${idx + 1}. ${result}`).join('\n')}`,
        channel_id
      );
    }
    await updateDiscordSubscription(sub.id, {last_run_at: currentTime});
  }
}

main();