import {ISearcher} from '.';
import { AtpAgent } from '@atproto/api'
import {AtUri, NSID} from '@atproto/syntax'


class BlueskySearcher implements ISearcher {
  client: AtpAgent;

  constructor() {
    this.client = new AtpAgent({service: 'https://public.api.bsky.app'})
  }

  async search(keyword: string, after: number): Promise<string[]> {
    const afterIso = new Date(after).toISOString();

    const results = await this.client.app.bsky.feed.searchPosts({
      q: keyword,
      sort: 'latest',
      since: afterIso,
    });

    if (!results.success) {
      throw new Error(JSON.stringify(results));
    }

    return (
      results.data?.posts.map(item => {
        const at = new AtUri(item.uri);
        const profileId = at.host.replace('did:plc:', '')
        const postId = at.pathname.split('/')[2]
        return `https://bsky.app/${profileId}/status/${postId}`
      }) ?? []
    );
  }
}

export default BlueskySearcher;
