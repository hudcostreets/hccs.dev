const { test } = require('node:test')
const { deepStrictEqual, rejects } = require('node:assert')
const gate = require('./org-preview-gate.cjs')

function fixture() {
  const sha = 'a'.repeat(40)
  const outputs = {}, comments = [], users = [], notices = []
  const pr = { state: 'open', draft: false, base: { ref: 'main' }, head: { sha, repo: { full_name: 'org/site' } } }
  const github = { rest: {
    pulls: { get: async () => ({ data: pr }) },
    repos: { getCollaboratorPermissionLevel: async ({ username }) => { users.push(username); return { data: { permission: 'write' } } } },
    issues: { createComment: async value => comments.push(value) },
  } }
  const context = { eventName: 'issue_comment', ref: 'refs/heads/main', sha, repo: { owner: 'org', repo: 'site' }, actor: 'maintainer', runId: 12,
    payload: { issue: { number: 4, pull_request: {} }, comment: { body: '/preview', user: { login: 'reviewer' } }, sender: { login: 'pusher' } } }
  const core = { setOutput: (key, value) => { outputs[key] = value }, notice: value => notices.push(value) }
  return { sha, outputs, comments, users, notices, pr, github, context, core }
}

test('a maintainer comment approves one exact head and records the build', async () => {
  const f = fixture()
  await gate(f)
  deepStrictEqual(f.outputs, { sha: f.sha, pr: '4', deploy_branch: 'pr-4' })
  deepStrictEqual(f.users, ['reviewer'])
  deepStrictEqual(f.comments, [{ owner: 'org', repo: 'site', issue_number: 4,
    body: `Building an organization-site preview of \`${f.sha}\`, authorized by @reviewer. [Build progress](https://github.com/org/site/actions/runs/12).` }])
})

test('stale head approval is rejected', async () => {
  const f = fixture()
  f.context.payload.comment.body = `/preview ${'b'.repeat(40)}`
  await rejects(gate(f), { message: 'Approval does not match the current PR head' })
  deepStrictEqual([f.outputs, f.comments], [{}, []])
})

test('unrelated or malformed comments do not authorize a build', async () => {
  for (const body of ['hello', '/preview junk', '/preview\nplease', '/preview 123', '/preview $(whoami)']) {
    const f = fixture()
    f.context.payload.comment.body = body
    await gate(f)
    deepStrictEqual([f.outputs, f.users, f.comments], [{}, [], []])
  }
})

test('read-only users cannot approve a preview', async () => {
  const f = fixture()
  f.github.rest.repos.getCollaboratorPermissionLevel = async () => ({ data: { permission: 'read' } })
  await gate(f)
  deepStrictEqual([f.outputs, f.comments, f.notices], [{}, [], ['A write collaborator must comment /preview or request a preview manually.']])
})

test('fork updates never inherit a trusted author approval', async () => {
  const f = fixture()
  f.context.eventName = 'pull_request_target'
  f.context.payload.pull_request = { number: 4 }
  f.pr.head.repo.full_name = 'other/site'
  await gate(f)
  deepStrictEqual([f.outputs, f.users, f.comments, f.notices], [{}, [], [], ['Fork previews require a write collaborator to comment /preview for the current head.']])
})

test('a maintainer can approve the current fork head explicitly', async () => {
  const f = fixture()
  f.pr.head.repo.full_name = 'other/site'
  await gate(f)
  deepStrictEqual(f.outputs, { sha: f.sha, pr: '4', deploy_branch: 'pr-4' })
})

test('same-repository updates check the current event sender rather than PR author', async () => {
  const f = fixture()
  f.context.eventName = 'pull_request_target'
  f.context.payload.pull_request = { number: 4 }
  await gate(f)
  deepStrictEqual(f.users, ['pusher'])
  deepStrictEqual(f.outputs, { sha: f.sha, pr: '4', deploy_branch: 'pr-4' })
})

test('pushes deploy integration commits to dev without PR permissions', async () => {
  const f = fixture()
  f.context.eventName = 'push'
  f.context.ref = 'refs/heads/org-site'
  await gate(f)
  deepStrictEqual(f.outputs, { sha: f.sha, source_branch: 'org-site', deploy_branch: 'main' })
  deepStrictEqual([f.users, f.comments], [[], []])
})

test('a manual PR request identifies its approver and validates its number', async () => {
  const f = fixture()
  f.context.eventName = 'workflow_dispatch'
  f.context.payload = { inputs: { pr: '4' } }
  await gate(f)
  deepStrictEqual(f.users, ['maintainer'])
  deepStrictEqual(f.outputs, { sha: f.sha, pr: '4', deploy_branch: 'pr-4' })
  f.context.payload.inputs.pr = '4; echo bad'
  await rejects(gate(f), { message: 'Invalid PR number' })
})

test('closed, draft, and unrelated-base PRs are rejected', async () => {
  for (const change of [{ state: 'closed' }, { draft: true }, { base: { ref: 'other' } }]) {
    const f = fixture()
    Object.assign(f.pr, change)
    await rejects(gate(f), { message: 'Expected an open, non-draft PR targeting main or org-site' })
    deepStrictEqual(f.outputs, {})
  }
})

test('manual integration deploys reject arbitrary branches', async () => {
  const f = fixture()
  f.context.eventName = 'workflow_dispatch'
  f.context.payload = { inputs: {} }
  f.context.ref = 'refs/heads/attacker'
  await rejects(gate(f), { message: 'Expected a trusted integration branch' })
})
