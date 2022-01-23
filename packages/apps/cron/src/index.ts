import 'dotenv/config';
import {getAllDiscordSubscriptions} from '@socialsnitch/database';
import {searchHackerNews} from './utils/hn-search';

async function main() {
  const subscription = await getAllDiscordSubscriptions();
  for (const sub of subscription) {
    const {keyword: keywords, last_run_at} = sub;
    const results = await searchHackerNews(
      keywords,
      Math.floor(new Date(last_run_at).getTime() / 1000)
    );
    console.log('results', Array.from(results));
  }
}

main();
