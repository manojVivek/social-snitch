### Steps to add new Social Platform to be available for monitoring:

1. Add the new social site to the `social_platform` table in the database.
2. Add the new social site's details to the `SOCIAL_PLATFORMS` constant in `packages/shared/database/src/constants.ts` file with the id value from the `social_platform` table entry.
3. Creater a new searcher for the new social site in `packages/apps/cron/src/searchers` folder that implmenets the `ISearcher` interface.
4. Add the new searcher to the `searchers` constant in `packages/apps/cron/src/searchers/index.ts` file.

The new Social Platform is ready to use now! 🎉