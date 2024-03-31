import * as github from '@actions/github'
import type { Api } from '@actions/github/node_modules/@octokit/plugin-rest-endpoint-methods/dist-types/types'

export async function checkAssignable(
  octokit: Api | undefined,
  issue_number: number,
  assignee: string
): Promise<boolean> {
  if (octokit === undefined) {
    return true
  }

  const resp = await octokit.rest.issues.checkUserCanBeAssignedToIssue({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number,
    assignee
  })

  return resp.status === 204
}

export async function addAssignees(
  octokit: Api | undefined,
  issue_number: number,
  assignees: string[]
): Promise<void> {
  if (octokit === undefined) {
    return
  }

  const resp = await octokit.rest.issues.addAssignees({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number,
    assignees
  })

  if (resp.status !== 201) {
    throw new Error(
      `Failed to add assignees to issue (code ${resp.status}): ${issue_number}`
    )
  }
}
