import * as github from '@actions/github'
import type { Api } from '@actions/github/node_modules/@octokit/plugin-rest-endpoint-methods/dist-types/types'

export async function addLabels(
  octokit: Api,
  issue_number: number,
  labels: string[]
): Promise<void> {
  const resp = await octokit.rest.issues.addLabels({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number,
    labels
  })

  if (resp.status !== 200) {
    throw new Error(
      `Failed to add labels to issue (code ${resp.status}): ${issue_number}`
    )
  }
}

export async function deleteLabel(
  octokit: Api,
  issue_number: number,
  label: string
): Promise<void> {
  const resp = await octokit.rest.issues.removeLabel({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number,
    name: label
  })

  if (resp.status !== 200) {
    throw new Error(
      `Failed to remove label from issue (code ${resp.status}): ${issue_number}`
    )
  }
}

export async function getLabels(
  octokit: Api,
  issue_number: number
): Promise<string[]> {
  const resp = await octokit.rest.issues.listLabelsOnIssue({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number
  })

  if (resp.status !== 200) {
    throw new Error(
      `Failed to get labels from issue (code ${resp.status}): ${issue_number}`
    )
  }

  return resp.data.map(label => label.name)
}
