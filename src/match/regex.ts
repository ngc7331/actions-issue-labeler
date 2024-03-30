import type { RegexMatch } from './types'
import type { Event } from '../event'

export async function tryMatch(
  event: Event,
  match: RegexMatch
): Promise<boolean> {
  const regex = match.keyword.match(/^\/(.+)\/(.*)$/)
  const content = event.title + event.body

  if (regex) {
    const extraFlags =
      regex[2].includes('i') || match.options.caseSensitive ? '' : 'i'
    return new RegExp(regex[1], regex[2] + extraFlags).test(content)
  }

  const flags = match.options.caseSensitive ? '' : 'i'
  return new RegExp(match.keyword, flags).test(content)
}
