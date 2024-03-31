import * as core from '@actions/core'
import * as github from '@actions/github'

import { parseEvent } from './event'
import { getConfig, parseConfig } from './config'
import type { Rule } from './config'
import { tryMatch } from './match'
import { addLabels, deleteLabel, getLabels } from './label'
import { checkAssignable, addAssignees } from './assignee'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const BOT_GITHUB_TOKEN = core.getInput('BOT_GITHUB_TOKEN')
    const CONFIG_PATH = core.getInput('CONFIG_PATH')

    const event = await parseEvent()
    core.info(`event: ${event.type} #${event.id}`)
    core.info(`title: ${event.title}`)
    core.info(`=== body begins ===\n${event.body}\n==== body ends ====\n\n`)

    const octokit =
      event.type === 'local_test'
        ? undefined
        : github.getOctokit(BOT_GITHUB_TOKEN)

    const config = await parseConfig(await getConfig(octokit, CONFIG_PATH))
    if (core.isDebug()) {
      core.debug(`config: \n${JSON.stringify(config, undefined, 2)}\n\n`)
    }
    const currentLabels = await getLabels(octokit, event.id)
    core.info(`current labels: [${currentLabels.join(', ')}]`)

    // iterate over the rules
    const matchedRules: Rule[] = []
    for (const rule of config.rules) {
      if (core.isDebug()) {
        core.debug(`trying rule: ${rule.name}`)
      }

      // iterate over the matches
      let matched = false
      for (const match of rule.matches) {
        // check if the event matches the rule
        matched = await tryMatch(event, match)
        if (core.isDebug()) {
          core.debug(`   ...match ${match.keyword}: ${matched}`)
        }

        if (matched) {
          matchedRules.push(rule)
          break
        }
      } // for match

      if (matched && rule.final) {
        break
      }
    } // for rule

    const matchedRuleNames = matchedRules.map(rule => rule.name)
    core.info(`matched rules: [${matchedRuleNames.join(', ')}]`)

    const filteredRules = matchedRules.filter(rule => {
      if (core.isDebug()) {
        core.debug(`trying rule: ${rule.name}`)
      }
      return !rule.skipIf.some(skip => {
        const hit = matchedRuleNames.includes(skip)
        if (core.isDebug() && hit) {
          core.debug(`   ...skip hits: ${skip}`)
        }
        return hit
      })
    })

    core.info(
      `filtered rules: [${filteredRules.map(rule => rule.name).join(', ')}]`
    )

    // handle adding/removing labels
    const labels = filteredRules.map(rule => rule.label)
    if (labels.length > 0) {
      if (
        currentLabels.length === 1 &&
        currentLabels[0] === config.labelNonMatch
      ) {
        core.info(`removing label: ${config.labelNonMatch}`)
        await deleteLabel(octokit, event.id, config.labelNonMatch)
      }
      core.info(`adding matched labels: [${labels.join(', ')}]`)
      await addLabels(octokit, event.id, labels)
    } else if (currentLabels.length === 0) {
      core.info(`adding non-match label: ${config.labelNonMatch}`)
      await addLabels(octokit, event.id, [config.labelNonMatch])
    } else {
      // no new labels are matched, and currently there are labels (assume manually added by user)
      core.info(`skip adding/removing labels`)
    }

    // handle adding assignees
    const assignees = filteredRules
      .map(rule => rule.assignees)
      .flat()
      .filter(async assignee => {
        const assignable = await checkAssignable(octokit, event.id, assignee)
        if (!assignable) {
          core.warning(
            `assignee ${assignee} is not assignable to issue #${event.id}`
          )
        }
        return assignable
      })
    if (assignees.length > 10) {
      core.warning(
        `assignees count exceeds the limit of 10, only the first 10 will be added`
      )
    }
    if (assignees.length > 0) {
      core.info(`adding assignees: [${assignees.slice(0, 10).join(', ')}]`)
      await addAssignees(octokit, event.id, assignees.slice(0, 10))
    } else {
      core.info(`no assignees to add`)
    }

    core.info(`Done.`)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
