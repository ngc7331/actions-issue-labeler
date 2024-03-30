import { tryMatch as tryFuzzyMatch } from './fuzzy'
import { tryMatch as tryRegexMatch } from './regex'
import { Match } from './types'
import { Event } from '../event'

export type {
  Match,
  MatchMode,
  FuzzyMatchOptions,
  RegexMatchOptions
} from './types'

export async function tryMatch(event: Event, match: Match): Promise<boolean> {
  switch (match.mode) {
    case 'fuzzy':
      return tryFuzzyMatch(event, match)
    case 'regex':
      return tryRegexMatch(event, match)
  }
}
