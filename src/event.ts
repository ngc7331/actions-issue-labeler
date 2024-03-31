import * as core from '@actions/core'
import * as github from '@actions/github'

export interface Event {
  type: 'issues' | 'issue_comment' | 'local_test'
  id: number
  title: string
  body: string
}

export async function parseEvent(): Promise<Event> {
  const ctx = github.context
  const eventName = ctx.eventName
  const payload = ctx.payload
  switch (eventName) {
    case 'issues':
      return {
        type: 'issues',
        id: payload.issue?.number || -1,
        title: payload.issue?.title || '',
        body: payload.issue?.body || ''
      }
    case 'issue_comment':
      return {
        type: 'issue_comment',
        id: payload.issue?.number || -1,
        title: '',
        body: payload.comment?.body
      }
    case undefined:
      core.warning('No event name found, assuming local test')
      return {
        type: 'local_test',
        id: -1,
        title: core.getInput('LOCAL_TEST_TITLE'),
        body: core.getInput('LOCAL_TEST_BODY')
      }
    default:
      throw new Error(`Unsupported event: ${eventName}`)
  }
}
