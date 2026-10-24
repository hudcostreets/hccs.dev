# HCCS organization website preview

React migration of [hudcostreets.org], isolated from the existing hccs.dev link tree. Worktree: `wt/org-site`; branch: `org-site`. Start commands from the worktree root.

```bash
pnpm install --frozen-lockfile
pnpm dev:org       # http://localhost:5281 or http://m3.rbw.sh:5281
pnpm build:org     # TypeScript check + static build to org/dist
pnpm preview:org   # Serve the build on :5281 (stop dev first)
```

## Editing content

Each imported page is an editable JSON document under `content/pages/`. Blocks are semantic HTML, local images, action links, campaign cards, or expandable details. React renders these blocks with shared page chrome. The homepage composition is in `src/App.tsx`; it combines the captured State of the Streets feature, mission, flagship campaigns, community photo, and existing data-project links. It is a first layout pass, not a pixel-identical Squarespace replica.

Images are checked into `public/media/`; `content/assets.json` maps their original URLs to local filenames. Fonts are self-hosted from `@fontsource`. The data-project cards use the same image URLs and content as the existing link-tree app. No Squarespace JavaScript or remote content API is required to render the imported pages.

Links to imported pages resolve locally. Links with section fragments stay on the original site until section IDs have been migrated. Links to other site pages remain on hudcostreets.org, including news, calendar/events, donations, membership, contact, and campaign action/volunteer forms. There are no mock submission flows.

## Capture and inventory

The public sitemap was captured on October 20, 2026: 267 URLs, including 217 event URLs. `content/inventory.json` records every sitemap route and its source modification date. Ten routes are captured: `/`, `/panynj`, `/hblr`, `/better-buses`, `/vision-zero`, `/our-story`, `/groups`, `/wins`, `/advocacy`, and `/get-involved`. `/home` is an alias for `/`.

Run the reusable importer from the worktree root:

```bash
scripts/squarespace-import.py inventory
scripts/squarespace-import.py capture /team /financials
scripts/test-squarespace-import.py
```

The CLI uses a `uv run` shebang with declared dependencies. Raw HTML and the original sitemap are cached under `tmp/squarespace/`. Existing authored JSON files are preserved unless you pass `--force`. To refresh source HTML, remove only the relevant cached HTML files, then capture again. Review diffs before replacing authored content.

The importer strips scripts, styles, event handlers, arbitrary attributes, and embedded forms. It names icon-only links and converts accordions to native expandable content. Each page's `review` array records custom code and unmapped blocks; `sourceImages` also records images outside normal image blocks, such as section backgrounds. These records are an audit trail, not a claim of complete migration. Do not automatically execute imported scripts.

## Remaining migration work

- Compare each imported page with the original, especially background logos, layout order, alt text, and custom code. The `/wins` content is extracted but needs a dedicated React layout; the original custom visual treatment is stripped.
- Replace Vision Zero's embedded crash charts with a deliberate component or links to the data project. The preview links to the original page for embedded features.
- Import the remaining organizational/resource pages, article archive, and event history. Choose an event data model before importing all 217 event URLs.
- Rebuild contact, membership, petition, and volunteer integrations where appropriate; preserve existing query parameters and submission destinations.
- Audit bilingual/translation support and other accessibility features. Squarespace's translation widget has not been migrated.
- Add route-level prerendering, canonical URLs, OG metadata/images, sitemap, and real HTTP 404 handling before an apex-domain cutover. Current hosting uses a SPA fallback; a missing route renders a not-found view with an HTTP 200.
- Optimize the imported image set and split large article content if needed. Images are lazy-loaded except the homepage feature; all page JSON currently shares the client bundle.

## Dev and PR deployments

The proposed hostname layout is:

| Host | Role |
| --- | --- |
| `hccs.dev` | Existing data-project hub and shortlinks |
| `www.hccs.dev` | Organization website, once the redesign is approved for public use |
| `dev.hccs.dev` | Reserved for a development version of the apex link tree |
| `dev.www.hccs.dev` | Proposed persistent organization-site integration preview |
| `pr-<number>.hccs-www-dev.pages.dev` | Stable alias for a PR's latest approved build |

The naming rule is `dev.X` for the development version of exactly `X`. Serving different applications at the apex and `www` is technically valid; treating them as aliases is a convention. Keep redirects and canonical URLs specific to each application, and use host-only cookies for any future authenticated controller. `www.hccs.dev` currently belongs to the existing link-tree Pages project; moving that binding is a separate cutover, not part of creating a preview.

The earlier recommendation to avoid `dev.www.hccs.dev` based solely on [Universal SSL] was too broad. Universal SSL for a full zone covers only the apex and one subdomain level, but Pages manages certificates for its [custom domains]. [Advanced certificates] do not apply to Pages custom domains. Register the exact hostname with Pages and verify its certificate and HTTPS response before relying on it; do not assume an ACM purchase is required. The `pages.dev` integration and PR URLs can be used before a custom hostname is bound.

`.github/workflows/org-preview.yml` implements direct-upload deployments to a separate **`hccs-www-dev` Pages project in the HCCS account**, using [Wrangler Pages deployments]. The existing link-tree project's Git integration keeps its own `pnpm build` configuration. The new project should not have an additional Git build running in parallel with this workflow.

- Pushes to `org-site` or `main` that affect the organization app build and deploy the integration version (Pages production branch `main` in the **dev project**).
- Same-repository PR events from write collaborators authorize a preview of the current head SHA. Fork PRs require a write collaborator's `/preview` comment or a manual workflow dispatch with a PR number. `/preview <full head SHA>` can explicitly pin that approval. New pushes never inherit old approvals.
- The PR build runs on a separate runner, with read-only repository permission, no persisted checkout credential, and no deployment secrets.
- The deploy job uses tools and config from trusted `main`, validates that the downloaded artifact contains only static assets, and re-applies trusted noindex headers, redirects, and robots rules. It never executes the PR's build scripts or deploys its Functions/Worker code.
- Before uploading, the deploy job checks that the PR is still open and its head SHA is unchanged. The final comment identifies the SHA and stable preview URL; the run log also contains the immutable deployment URL.
- No workflow here deploys `www.hccs.dev` or changes the existing apex project. A production promotion workflow is future work, after content/functionality review.

Run `pnpm test:previews` to test the gate and artifact boundary; `node .github/scripts/org-static-artifact.mjs org/dist` validates a local build. The workflow also passes Actionlint. Preview URL aliases update, so review a fixed deployment URL plus its commit before approving publication.

### Activation

1. Commit and put the trusted workflow, gate, artifact validator, and `org/wrangler.jsonc` on default branch `main`. This bootstrap is required: privileged jobs deliberately check out `main`. The code is prepared locally and has not been committed or pushed.
2. Create direct-upload Pages project `hccs-www-dev` in HCCS, with production branch `main`. Do not copy production secrets or database bindings into it. The static-site configuration needs none.
3. Configure GitHub environment `org-preview`, restricted to branches `main` and `org-site`. Add variable `HCCS_CLOUDFLARE_ACCOUNT_ID` and secret `HCCS_CLOUDFLARE_API_TOKEN` with access to Pages deployment in that account. Cloudflare credentials remain confined to the trusted deploy job. A Pages write token is account-scoped; the fixed project name is a workflow boundary, not a claim that the token itself is limited to one project. Keep production deploy credentials in a different protected environment.
4. Run the workflow manually for the integration branch, or push an organization-site change. Watch the run with `ghws -w org-preview.yml <sha>`. Validate a real PR deploy and a fork request before calling the automation active.
5. Bind `dev.www.hccs.dev` to the dev project, verify certificate activation, and verify it in Chrome. Keep `dev.hccs.dev` for the apex application's development version. Do not move `www` until the organization-site launch is approved. If a single project is used later, Cloudflare also supports [custom branch domains].

The preview has a visible preview label, HTML `noindex, nofollow`, response headers, and robots exclusions. Those discourage indexing; they are not authentication. The public preview has no admin session or production data. An authenticated editing portal and private data previews require the separate design in [shared site editing].

Local Vite preview does not emulate Cloudflare header or redirect rules. No Pages project, domain binding, or live deployment has been created for this app yet.

Activation status (October 20): GitHub environment `org-preview` has been created, with deployment policies for `main` and `org-site`, and its HCCS account-ID variable is set. The deployment secret is absent. Local Wrangler OAuth is expired and could not refresh, so it cannot provision/deploy the Pages project. An existing `hccs.dev` DNS-edit token is present locally; its purpose is DNS, and it is not being reused as a Pages deployment credential. No credentials were printed or copied between accounts.

The [use-prms preview] is another verified reference. Local workflow/config/gate source and the saved logs of [its successful run] show approval of commit `55b5869f77f06f6153c322300bd871756941498a`, a separate credential-free build job, and deployment from trusted `main` to a per-PR static-assets Worker. That repo also deletes the Worker when a PR closes. HCCS uses Pages deployment aliases instead of one Worker per PR; automatic preview retention/cleanup remains a follow-up. HCCS additionally checks the current SHA immediately before deploy and validates static artifacts before upload.

[hudcostreets.org]: https://hudcostreets.org
[Pages monorepos]: https://developers.cloudflare.com/pages/configuration/monorepos/
[Pages build configuration]: https://developers.cloudflare.com/pages/configuration/build-configuration/
[Universal SSL]: https://developers.cloudflare.com/ssl/edge-certificates/universal-ssl/limitations/
[custom domains]: https://developers.cloudflare.com/pages/configuration/custom-domains/
[Advanced certificates]: https://developers.cloudflare.com/ssl/edge-certificates/advanced-certificate-manager/
[use-prms preview]: https://github.com/runsascoded/use-prms/pull/1#issuecomment-6250809152
[its successful run]: https://github.com/runsascoded/use-prms/actions/runs/39132971859
[Wrangler Pages deployments]: https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/
[custom branch domains]: https://developers.cloudflare.com/pages/how-to/custom-branch-aliases/
[shared site editing]: ../specs/shared-site-editing.md
