# Migrate hudcostreets.org from Squarespace to React

Requested October 20, 2026. Start in an isolated branch/worktree in this repo and work toward a preview subdomain. The existing Squarespace site and the hccs.dev link tree continue serving their current content.

## First reviewable slice

- [x] Create branch `org-site`, worktree `wt/org-site`.
- [x] Inventory the public sitemap: 267 URLs, 217 under `/events`.
- [x] Add a separate React/Vite app in `org/` with dev/preview port 5281.
- [x] Capture ten core pages and local copies of their image blocks.
- [x] Add a reusable cached importer that preserves authored page files by default and records unsupported content for review.
- [x] Build shared navigation, footer, mobile menu, native accordions, campaign catalogue, and a homepage using existing copy and artwork.
- [x] Retain working external destinations for donations, petitions, newsletter signup, volunteering, and archived content.
- [x] Add indexing exclusions for the preview and document a separate Pages project.
- [x] Verify both application builds, five importer tests, all ten routes at mobile width, mobile menu interaction, and a campaign accordion in Chrome.
- [x] Prepare and test a trusted-build/deploy PR-preview workflow modeled on jc-taxes (October 20 follow-up).
- [x] Create GitHub environment `org-preview`, restrict deployment branches, and set the HCCS account-ID variable. Deployment token and first live run remain pending.
- [x] Read EPC's intake research and write [shared editing research] covering managed tools, VibeSDK, auth reuse, and five-site adapters.

See [the migration README] for commands, captured routes, content editing, source records, and outstanding parity work.

## Following phases

- [ ] Review the first slice; proposed hosts are `www.hccs.dev` for the approved organization site and `dev.www.hccs.dev` for integration previews. Preserve `dev.hccs.dev` for development of the apex link tree, following the user's `dev.X` rule. Verify the Pages custom-domain certificate before enabling the nested hostname.
- [x] Publish the preview to a separate project in the HCCS Cloudflare account: `hccs-www-dev`, deployed from `main` by `org-preview.yml` (October 23). https://hccs-www-dev.pages.dev
- [ ] Exercise a same-repo PR preview and a fork `/preview` request.
- [x] Bind `dev.www.hccs.dev`: proxied CNAME to `hccs-www-dev.pages.dev`; Pages-issued certificate verified (October 23). https://dev.www.hccs.dev
- [ ] Migrate the remaining static pages, news, events, custom embeds, and translation support.
- [ ] Establish route-level metadata/prerendering, correct HTTP status codes, redirects, analytics, and integration checks before a production-domain cutover.

This spec remains active: the first slice starts the migration and does not complete the Squarespace replacement. The app and preview tooling are on `main` (October 23); `org-site` points at the same commit. Production hostname cutover and a shared agent-editing service remain separate review decisions.

[the migration README]: ../org/README.md
[shared editing research]: shared-site-editing.md
