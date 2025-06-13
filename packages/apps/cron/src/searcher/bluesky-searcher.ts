import {ISearcher} from '.';
import { AtpAgent } from '@atproto/api'
import {AtUri} from '@atproto/syntax'


class BlueskySearcher implements ISearcher {
  client: AtpAgent;

  constructor() {
    this.client = new AtpAgent({service: 'https://bsky.social'})
  }

  private async ensureAuthenticated(): Promise<void> {
    const identifier = process.env.BLUESKY_IDENTIFIER;
    const password = process.env.BLUESKY_PASSWORD;
    
    if (!identifier || !password) {
      throw new Error('BLUESKY_IDENTIFIER and BLUESKY_PASSWORD environment variables are required');
    }

    if (!this.client.session) {
      await this.client.login({
        identifier,
        password,
      });
    }
  }

  async search(keyword: string, after: number): Promise<string[]> {
    const afterIso = new Date(after).toISOString();

    try {
      await this.ensureAuthenticated();

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
          const profileId = at.host;
          const postId = at.pathname.split('/')[2];
          return `https://bsky.app/profile/${profileId}/post/${postId}`;
        }) ?? []
      );
    } catch (error: any) {
      console.error(`Failed to search Bluesky for "${keyword}":`, error.message || error);
      return [];
    }
  }
}

export default BlueskySearcher;
