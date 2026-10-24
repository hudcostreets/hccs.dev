const COMMAND = /^\/preview(?:\s+([0-9a-f]{40}))?$/i
const TRUSTED_BRANCHES = ['main', 'org-site']

module.exports = async function gate({ github, context, core }) {
  const payload = context.payload
  const comment = context.eventName === 'issue_comment'
  const match = comment && payload.comment.body.trim().match(COMMAND)
  if (comment && (!payload.issue.pull_request || !match)) return

  const push = context.eventName === 'push'
  const manual = context.eventName === 'workflow_dispatch'
  if (push || (manual && !payload.inputs?.pr)) {
    const branch = context.ref.replace(/^refs\/heads\//, '')
    if (!TRUSTED_BRANCHES.includes(branch)) throw new Error('Expected a trusted integration branch')
    if (!/^[0-9a-f]{40}$/.test(context.sha)) throw new Error('Invalid source commit')
    core.setOutput('sha', context.sha)
    core.setOutput('source_branch', branch)
    core.setOutput('deploy_branch', 'main')
    return
  }

  const rawNumber = comment ? payload.issue.number : payload.pull_request?.number || payload.inputs?.pr
  if (!/^[1-9]\d*$/.test(String(rawNumber))) throw new Error('Invalid PR number')
  const number = Number(rawNumber)
  if (!Number.isSafeInteger(number)) throw new Error('Invalid PR number')
  const { data: pr } = await github.rest.pulls.get({ ...context.repo, pull_number: number })
  if (pr.state !== 'open' || pr.draft || !TRUSTED_BRANCHES.includes(pr.base.ref)) {
    throw new Error('Expected an open, non-draft PR targeting main or org-site')
  }
  if (!/^[0-9a-f]{40}$/.test(pr.head.sha)) throw new Error('Invalid PR head')

  // A new push must be admitted on its own; the original author's permissions are insufficient.
  if (!comment && !manual && pr.head.repo?.full_name !== `${context.repo.owner}/${context.repo.repo}`) {
    core.notice('Fork previews require a write collaborator to comment /preview for the current head.')
    return
  }
  const login = comment ? payload.comment.user.login : manual ? context.actor : payload.sender.login
  let permission
  try {
    permission = (await github.rest.repos.getCollaboratorPermissionLevel({ ...context.repo, username: login })).data.permission
  } catch (error) {
    // A non-collaborator is a legitimate requester, but cannot authorize a deployment.
    if (error.status !== 404) throw error
  }
  if (!['write', 'maintain', 'admin'].includes(permission)) {
    core.notice('A write collaborator must comment /preview or request a preview manually.')
    return
  }
  if (match?.[1] && match[1].toLowerCase() !== pr.head.sha) {
    throw new Error('Approval does not match the current PR head')
  }

  core.setOutput('sha', pr.head.sha)
  core.setOutput('pr', String(number))
  core.setOutput('deploy_branch', `pr-${number}`)
  await github.rest.issues.createComment({ ...context.repo, issue_number: number,
    body: `Building an organization-site preview of \`${pr.head.sha}\`, authorized by @${login}. [Build progress](https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}).` })
}
