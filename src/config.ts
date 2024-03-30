import * as github from '@actions/github'
import type { Api } from '@actions/github/node_modules/@octokit/plugin-rest-endpoint-methods/dist-types/types'
import * as yaml from 'yaml'

import { extractObj } from './utils'
import type {
  Match,
  MatchMode,
  FuzzyMatchOptions,
  RegexMatchOptions
} from './match'

export interface Rule {
  name: string
  matches: Match[]
  label: string
  assignees: string[]
  skipIf: string[]
  final: boolean
}

export interface Config {
  defaultMode: MatchMode
  defaultFuzzyOptions: FuzzyMatchOptions
  defaultRegexOptions: RegexMatchOptions
  labelNonMatch: string
  rules: Rule[]
}

export async function getConfig(octokit: Api, path: string): Promise<object> {
  const resp = await octokit.rest.repos.getContent({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    path,
    ref: github.context.sha
  })

  if (resp.status !== 200) {
    throw new Error(`Failed to load config file (code ${resp.status}): ${path}`)
  }

  const data = resp.data
  if (Array.isArray(data) || data.type !== 'file') {
    throw new Error(`Config file is not a file: ${path}`)
  }

  const obj = yaml.parse(Buffer.from(data.content, 'base64').toString('utf-8'))
  if (typeof obj !== 'object') {
    throw new Error(`Failed to parse config file: ${path}`)
  }

  return obj
}

function parseMatch(
  obj: object,
  defaultMode: MatchMode,
  defaultFuzzyOptions: FuzzyMatchOptions,
  defaultRegexOptions: RegexMatchOptions
): Match {
  const keyword: string = extractObj(obj, 'keyword') || ''
  if (typeof keyword !== 'string' || keyword === '') {
    throw new Error(`Invalid keyword: ${keyword}`)
  }
  const mode: MatchMode = extractObj(obj, 'mode') || defaultMode
  switch (mode) {
    case 'fuzzy':
      return {
        keyword,
        mode,
        options: {
          threshold:
            extractObj(obj, 'fuzzy.thres') || defaultFuzzyOptions.threshold,
          caseSensitive:
            extractObj(obj, 'case-sensitive') ||
            defaultFuzzyOptions.caseSensitive
        }
      }
    case 'regex':
      return {
        keyword,
        mode,
        options: {
          caseSensitive:
            extractObj(obj, 'case-sensitive') ||
            defaultRegexOptions.caseSensitive
        }
      }
    default:
      throw new Error(`Invalid mode: ${mode}`)
  }
}

export async function parseConfig(obj: object): Promise<Config> {
  const config: Config = {
    defaultMode: extractObj(obj, 'default.mode') || 'fuzzy',
    defaultFuzzyOptions: {
      threshold: extractObj(obj, 'default.fuzzy.thres') || 90,
      caseSensitive: extractObj(obj, 'default.case-sensitive') || false
    },
    defaultRegexOptions: {
      caseSensitive: extractObj(obj, 'default.case-sensitive') || false
    },
    labelNonMatch: extractObj(obj, 'label-nonmatch') || 'ambigous',
    rules: []
  }
  const rules: object = extractObj(obj, 'rules') || {}

  // checks
  if (
    typeof config.defaultMode != 'string' ||
    (config.defaultMode !== 'fuzzy' && config.defaultMode !== 'regex')
  ) {
    throw new Error(`Invalid default.mode: ${config.defaultMode}`)
  }
  if (
    typeof config.defaultFuzzyOptions.threshold != 'number' ||
    config.defaultFuzzyOptions.threshold < 0 ||
    config.defaultFuzzyOptions.threshold > 100
  ) {
    throw new Error(
      `Invalid default.fuzzy.threshold: ${config.defaultFuzzyOptions.threshold}`
    )
  }
  if (
    typeof config.defaultFuzzyOptions.caseSensitive != 'boolean' ||
    typeof config.defaultRegexOptions.caseSensitive != 'boolean'
  ) {
    throw new Error(
      `Invalid default.case-sensitive: ${config.defaultFuzzyOptions.caseSensitive}`
    )
  }
  if (typeof config.labelNonMatch != 'string') {
    throw new Error(`Invalid label-nonmatch: ${config.labelNonMatch}`)
  }
  if (typeof rules != 'object') {
    throw new Error(`Invalid rules: ${rules}`)
  }

  // parse rules
  for (const [name, rule] of Object.entries(rules)) {
    if (typeof rule != 'object') {
      throw new Error(`Invalid rule: ${name}`)
    }
    const matches: object[] = extractObj(rule, 'match') || []
    config.rules.push({
      name,
      matches: matches.map(match => {
        if (typeof match != 'object') {
          throw new Error(`Invalid match in rule ${name}`)
        }
        return parseMatch(
          match,
          config.defaultMode,
          config.defaultFuzzyOptions,
          config.defaultRegexOptions
        )
      }),
      label: extractObj(rule, 'label'),
      assignees: extractObj(rule, 'assignees') || [],
      skipIf: extractObj(rule, 'skip-if') || [],
      final: extractObj(rule, 'final') || false
    })
  }

  return config
}
