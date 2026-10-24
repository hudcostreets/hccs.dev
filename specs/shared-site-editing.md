# Shared prompt-to-preview editing for nonprofit sites

Research and proposed direction, October 20, 2026. This is a design proposal, not authorization to deploy a new editing service or change the other projects. HCCS and EPC are the first concrete consumers. BikeJC's live site is on Wix; its old repo could be rebooted for a later adoption. Streetspace NJ and 380NWK have less immediate need for nontechnical agent publishing and should not drive the first implementation.

## Recommendation

Build a small shared editing service around the existing `@open-athena/auth` package, a hosted coding-agent runner, repository PRs, and each site's own preview deployment adapter. Do not build a new coding agent, auth library, or hosting platform. Keep the service independent of the website being edited, so a content/layout edit cannot modify the controller that authorized it. Start with a signed-in web request and outbound email notifications. Inbound email is optional later.

Before committing to building that service, run one comparable pilot in Netlify Agent Runners or Builder: import the existing HCCS branch, invite a proposer without GitHub access, request a photo/caption change and then a layout change, iterate, and have Ryan review a PR. Do not migrate hosting or buy a plan solely for the pilot. Compare setup work, proposal-only permissions, preview behavior, accessible mobile UX, cost per completed edit, and export of the resulting changes. This pilot is proposed, not performed.

## EPC context and corrections

Read `claude:8f2aeaaf-98d1-4bf4-9289-ad49cb242fa6` through raw line 3294, last transcript event `2026-10-13T23:52:05.425Z` (initial bilateral verdict: BOTH). Read `~/c/epc/www/specs/agent-intake.md` and `cf-migration.md`, and the intake code/workflow. The latest discussion already recommended web admin plus outbound notifications, although the committed spec still says email first. There is intake policy/storage/email-adapter code and a GitHub workflow, but no completed authenticated prompt-to-preview UI or callback/notification loop. Reading the discussion does not authorize its suggested mutations in EPC.

The existing workflow is an implementation reference, not a safe reusable template. The October 13 review found shell interpolation of requester text, a same-job repository write token during agent execution, insufficient path restrictions, incomplete commit/callback handling, public exposure of requester text, and an unprotected main branch. Local source still shows those patterns. This research did not re-audit remote EPC protection or deploy settings. Fix them before activating EPC's intake or extracting its code.

`@open-athena/auth` is already reusable: local HEAD `668c50e` on October 20 exposes backend gating, Google/email-code sign-in, D1 allowlists and stores, a framework-free client, and React/Vue UI primitives. Pin a tested dist-branch SHA; reuse it rather than copy its auth code. It does not supply proposals, agent jobs, review policy, PRs, or deployments. Its access log does not replace a proposal event log.

## Existing tools worth considering

| Option | Verified capability | Assessment for these sites |
| --- | --- | --- |
| [Netlify Agent Runners] | Existing-project prompts, asynchronous runs, clarifications, previews, and optional GitHub PRs. An Internal Builder role can propose while Developers control deployment. Requires a Netlify team, enabled AI features, and available credits. | Closest managed replacement for most of the loop. Strong pilot candidate for static sites; assess hosting/backend coupling and team roles rather than assuming every user needs GitHub. |
| [Builder Code] | Connect an existing repository, prompt changes in a visual editor, and create PRs. [Code pricing] uses plans and per-user agent-credit allowances. | Strong existing-repository option, especially for layout work. More UI and vendor configuration than a tiny request form; verify proposer permissions and the exact export/review flow in a pilot. |
| [Cloudflare VibeSDK] | MIT-licensed app-building platform with conversational editing, workspace/history, previews, and a code editor. Local clone inspected at `9da158d`. | A real fork candidate, but heavier than this use case: Think/SpaceDO/Artifacts/Dynamic Worker application generation, with GitHub export/sync. The inspected export controller is not evidence of a turnkey import-existing-repo → limited PR → human publish flow. SPNJ's Rails app also does not fit its generated Worker runtime. Borrow UX patterns; do not adopt the entire platform by default. |
| [Pages CMS] | Email-invited content/media editors without GitHub accounts; writes use its GitHub App. | Useful for predictable caption/date/photo edits now that HCCS content is in JSON. It is not itself the conversational code-change pipeline; verify branch/editorial behavior before promising PR review. |
| [Cloudflare coding-agent runner] / [OpenHands GitHub Action] | Existing agent execution and repository automation building blocks. | Buy/reuse execution; the site/identity/proposal/review interface remains ours. Start with the familiar runner before operating a custom sandbox fleet. |

These assessments distinguish product capability from fit; they are not claims that the pilots have passed. Pricing changes quickly: use current [Netlify pricing], [Netlify AI billing], and [Builder pricing] to price actual expected users and completed runs, rather than reusing the October 13 report's numbers.

## Free tiers checked October 20

| Option | Free allowance | Consequence for a board-member editing pilot |
| --- | --- | --- |
| [Netlify pricing] / [Netlify AI billing] | $0, 300 shared usage credits/month, one concurrent agent run, one active team member; unlimited deploy previews and Git contributors on public repos. AI inference uses 180 credits per $1 of underlying model usage, with agent compute charged separately. | Good for a solo trial. Even if all credits went to inference, 300 credits would cover only about $1.67 of provider-priced model usage; actual allowance is lower after compute/traffic/deploys. Git contributors and reviewers are not additional prompt-capable team members. Pro is advertised at $20/month with unlimited members and an initial 3,000-credit allowance. |
| [Builder pricing] | $0, 15 agent credits/day capped at 60/month, one included user, admin-only role, repository integration and project hosting. | A small product trial; differentiated editor/developer permissions and password-protected previews are Team features. The page advertises Pro at $24/user/month and Team at $40/user/month, with monthly/annual billing options; verify the selected billing interval at checkout. Paid Code plans provide 500 monthly credits/user. Free credits are a per-space cap; do not assume five users multiply them. |
| [Cloudflare VibeSDK] / [VibeSDK setup] | MIT source code is free. Self-hosting and model inference are separate costs; there is no bundled free operating allowance. Current production-preview prerequisites include Workers Paid and Workers for Platforms access. | Not a zero-cost hosted alternative. [Workers pricing] starts at $5/month for the standard paid plan, but that is not the full VibeSDK platform/model bill. Its generated-app runtime and production prerequisites are substantial for an existing-repo PR editor. |
| [Pages CMS pricing] | Hosted version and MIT source are free. Email-invited collaborators can edit content without GitHub accounts. | Useful for structured content/media editing; it does not include an agent runner or conversational code changes. Repository/deployment hosting and any added model execution retain their own limits. |

Netlify also has an application-based [Open Source plan] with unlimited team members and additional benefits. Eligibility requires an appropriate license, a Code of Conduct, a backlink, noncommercial use, and a site tied to an open source project/community. A public nonprofit website repo alone does not establish eligibility. Check this before ruling out Netlify on cost, but do not promise qualification or submit an application as part of this research.

For the specific multiuser prompt-to-PR flow, Netlify is the strongest managed pilot from this shortlist if its paid team plan or open source program fits. Pages CMS is a useful complementary option for routine edits. VibeSDK remains a source of patterns; a thin shared controller with an existing runner still looks more proportionate than a full platform fork if we build our own.

## One service, site-specific policies and deployment adapters

```text
Sign in → choose an authorized site → describe the change → proposal + conversation
  → isolated runner checks out a fixed base SHA → produces a patch
  → trusted validation/commit job → scoped GitHub App opens/updates a PR
  → that site's preview pipeline → URL + summary in the proposal and email
  → requester iterates → designated publisher reviews → merge/promote
```

Site membership and propose/review/publish capabilities are checked server-side for every proposal and action, keyed by site. A person on several boards switches sites in one portal; logging in never grants access to every connected repository. Use host-only auth cookies on the editing service. Keep public static previews separate from the controller's credentials and sessions.

The controller owns site configuration: repository, permitted base branches, build command, editable paths, agent budget, preview adapter, publishers, and data policy. A prompt cannot supply a different repo, command, callback URL, or account. A proposal retains the full conversation, base SHA, run attempts, output commit SHA, PR, immutable preview URL, stable alias, review/approval target, and event history. Bind approval to a specific commit/artifact; a follow-up invalidates old approval. Handle duplicate dispatch/callbacks, cancellation, and concurrent requests explicitly. Do not paste private prompts or email addresses into public PR descriptions.

Run code and dependency hooks without GitHub write or deployment credentials. A separate trusted job checks an allowlist of changed paths and hands off the accepted patch using a short-lived repo-scoped GitHub App token. Application code may never change workflows, auth/intake code, migrations, package scripts, deployment config, or CI policies under a normal proposer scope. A broader developer request can use a separate review path. Preview deploys have no production DB/secrets. A private-data app needs isolated synthetic data and an actual preview gate, not just noindex.

GitHub automation also needs explicit event design: current [GitHub token trigger rules] say PR open/synchronize/reopen events produced by `GITHUB_TOKEN` can enter an approval-required state; other automatic event chains are suppressed except explicit dispatches. Use a scoped GitHub App or an explicit trusted preview dispatch when unattended agent-generated PR previews are required. Do not assume a bot's `git push` automatically runs the rest of the pipeline.

## The five projects are not one web stack

| Site | Local evidence | Integration consequence |
| --- | --- | --- |
| HCCS | `~/c/hccs/hccs.dev/wt/org-site/org`: Vite/React, static build | Best first live pilot; public content, no runtime preview bindings required. |
| EPC | `~/c/epc/www`: Vite/React, Pages Functions and D1, existing intake prototype | Second adopter; retain signup/auth data separation and fix workflow issues first. |
| BikeJC | User confirms live site moved to Wix. `~/c/bjc/www` is an outdated Next 13 static export with shared-host rsync scripts. | Potential third adopter after deciding whether to reboot the repo and replace Wix. Do not treat the old build or deployment settings as the current live system. |
| Streetspace NJ | `~/c/spnj/www`: Rails 8.1, SQLite, Fly deploy workflow | Lower priority for nontechnical publishing. If adopted, reuse portal/PR contracts with a Rails/Fly preview adapter and isolated data. No React rewrite is needed. |
| 380NWK | `~/c/380nwk/budget/www`: React, Worker, D1, already pinned to `@open-athena/auth`, separate dev configuration | Lower priority for nontechnical publishing. Shares auth/client contracts; private financial data requires synthetic fixtures and gated previews. This budget app is not evidence that the entire public website should be replaced. |

Build the shared core outside HCCS once the pilot is selected. Avoid five copied frameworks or a single shared production database containing all organizations' sensitive data. A common service can keep authorization/proposal records separated by site while deployments, credentials, data stores, and agent workspaces remain isolated.

## HCCS migration strategy

The current React app is a partial content migration and a new layout, not a faithful replica. Ten local routes are extracted from a 267-URL sitemap; 217 URLs are events. Sanitization retains much of the text, images, and action destinations, but strips original layout/scripts and records unsupported blocks. Navigation, typography, spacing, homepage ordering, responsive behavior, and campaign composition differ; custom wins styling, some backgrounds/charts, translation, native forms, archive pages, and route metadata still need work. There is no measured visual-similarity percentage or complete parity claim.

Recommend one redesign branch with a content/functionality checklist. Preserve the raw captures, inventory, and original screenshots as references. A short-lived fidelity worktree is useful only for a specific comparison; two long-lived design branches would double maintenance without solving migration completeness. Keep Squarespace serving until the redesigned routes, old URLs, forms, archives, and integrations pass review; the new design can be public on `www.hccs.dev` earlier without claiming to replace hudcostreets.org.

## Next decisions and implementation slices

1. HCCS: activate the prepared static PR-preview pipeline, verify and bind `dev.www.hccs.dev` through Pages custom domains, and review the redesign's migration checklist. Keep `dev.hccs.dev` for development of the apex link tree.
2. Pilot either the small shared portal or one managed option against HCCS and EPC; choose using real edits and proposer experience.
3. If building: extract the corrected proposal/runner contracts into a shared project, adopt `@open-athena/auth`, implement sign-in + prompt + threaded status/preview page, and wire one isolated runner/preview adapter.
4. Add the second site before stabilizing the package API. Add inbound email or a structured CMS only when actual requester behavior warrants it.

[Netlify Agent Runners]: https://docs.netlify.com/build/build-with-ai/agent-runners/make-changes-with-agent-runners/
[Netlify pricing]: https://www.netlify.com/pricing/
[Netlify AI billing]: https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/pricing-for-ai-features/
[Builder Code]: https://www.builder.io/c/docs/builder-code-projects-from-repositories
[Code pricing]: https://www.builder.io/pricing
[Builder pricing]: https://www.builder.io/pricing
[Pages CMS pricing]: https://pagescms.org/
[VibeSDK setup]: https://github.com/cloudflare/vibesdk/blob/main/docs/setup.md
[Workers pricing]: https://developers.cloudflare.com/workers/platform/pricing/
[Open Source plan]: https://www.netlify.com/open-source/
[Cloudflare VibeSDK]: https://github.com/cloudflare/vibesdk
[Pages CMS]: https://pagescms.org/docs/configuration/collaborators/
[Cloudflare coding-agent runner]: https://developers.cloudflare.com/sandbox/get-started/build-a-coding-agent-runner/
[OpenHands GitHub Action]: https://docs.openhands.dev/openhands/usage/run-openhands/github-action
[GitHub token trigger rules]: https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow
