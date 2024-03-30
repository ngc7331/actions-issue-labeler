import { partial_ratio } from 'fuzzball'

import type { FuzzyMatch } from './types'
import type { Event } from '../event'

export async function tryMatch(
  event: Event,
  match: FuzzyMatch
): Promise<boolean> {
  // FIXME: partial_ratio() calls full_process() by default, which does str.toLowerCase()
  //        and match.options.caseSensitive is not used
  //        this is not ideal if we want to support case-sensitive matching
  return (
    partial_ratio(match.keyword, event.title + event.body) >=
    match.options.threshold
  )
}
