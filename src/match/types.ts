interface BaseMatchOptions {
  caseSensitive: boolean
}

export interface FuzzyMatchOptions extends BaseMatchOptions {
  threshold: number
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RegexMatchOptions extends BaseMatchOptions {}

export type MatchMode = 'fuzzy' | 'regex'

interface BaseMatch {
  keyword: string
}

export interface FuzzyMatch extends BaseMatch {
  mode: 'fuzzy'
  options: FuzzyMatchOptions
}

export interface RegexMatch extends BaseMatch {
  mode: 'regex'
  options: RegexMatchOptions
}

export type Match = FuzzyMatch | RegexMatch
