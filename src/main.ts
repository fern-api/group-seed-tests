import * as core from '@actions/core'
import { calculateTotalTimes } from './timeConversions.js'
import { createBalancedGroups } from './packingAlgorithm.js'
import {
  parseDataFromSeedTestAsciiTable,
  ParsedRow
} from './seedTestLogParser.js'
import fs from 'fs'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    core.info('Starting main function!!!')
    const seedGeneratorAlias: string = core.getInput('seed-generator-alias')
    const maxRunnerCount: string = core.getInput('max-runner-count')
    // const jsonData: string = core.getInput('json-data');
    const splitTestsCutoffTimeInSeconds: string = core.getInput(
      'split-tests-cutoff-time-in-seconds'
    )
    const seedTestLogFilePath: string = core.getInput('seed-test-log-file-path')

    // Start by validating inputs
    // Validate seed-generator-alias
    // CHRISM - does this already happen for me by getInput?
    if (seedGeneratorAlias) {
      core.debug(`Seed generator alias: ${seedGeneratorAlias}`)
    } else {
      core.error('No seed generator alias provided')
      return
    }

    // Validate max-runner-count
    if (maxRunnerCount) {
      core.debug(`Max runner count: ${maxRunnerCount}`)
    } else {
      core.error('No max runner count provided')
      return
    }

    // Validate output-file-path
    if (seedTestLogFilePath) {
      if (fs.existsSync(seedTestLogFilePath)) {
        core.debug(`Seed test log file path exists: ${seedTestLogFilePath}`)
      } else {
        core.error(
          `Provided seed test log file path does not exist: ${seedTestLogFilePath}`
        )
        return
      }
    } else {
      core.error('No seed test log provided')
      return
    }

    let extractedTableOfTests: string = ''
    try {
      const fileContent = fs.readFileSync(seedTestLogFilePath, 'utf-8')
      // console.log('File content:', fileContent);

      // const startTag: string = '<CLI-SEED-TEST-PARSING-TAG>'
      // const endTag: string = '<CLI-SEED-TEST-PARSING-TAG/>'
      const startTag: string = '┌──────'
      const endTag: string = 'test cases' // CHRISM - just for testing but should add tags
      const startIndex: number = fileContent.indexOf(startTag)
      const endIndex: number = fileContent.indexOf(
        endTag,
        startIndex + startTag.length
      )

      if (startIndex !== -1 && endIndex !== -1) {
        extractedTableOfTests = fileContent.substring(
          startIndex + startTag.length,
          endIndex
        )
      } else {
        console.log(
          `CLI-SEED-TEST-PARSING-TAG delimiters not found in ${seedTestLogFilePath} or in incorrect order.`
        )
      }
    } catch (error) {
      console.error('Error reading seed test log file:', error)
    }
    console.log('Successfully parsed test table from test log file!')
    // console.debug(`extractedTableOfTests:\n${extractedTableOfTests}`)

    let extractedJsonData: ParsedRow[] = await parseDataFromSeedTestAsciiTable(
      extractedTableOfTests
    )

    // Validate extracted json-data
    if (!extractedJsonData) {
      core.error('No data returned from parseTimesFromSeedTestAsciiTable')
      return
    }

    // Convert string time format into usable format and combine generation and compile times for a single time
    const result = calculateTotalTimes(extractedJsonData) // CHRISM - async await?
    const jsonOfTestTotalTimes = JSON.stringify(result, null, 2)
    console.debug(`jsonOfTestTotalTimes: ${jsonOfTestTotalTimes}`)
    console.log(`\nTotal entries processed: ${Object.keys(result).length}`)

    // Convert result object to array format for createBalancedGroups
    const itemsArray = Object.entries(result).map(([name, time]) => ({
      name: name,
      time: time
    }))

    // Package the tests into balanced groups
    const balancedGroups = createBalancedGroups(
      itemsArray,
      parseInt(maxRunnerCount)
    )
    const jsonOfBalancedGroups = JSON.stringify(balancedGroups, null, 2)
    console.debug(`jsonOfBalancedGroups: ${jsonOfBalancedGroups}`)

    const totalTestTime = Object.values(result).reduce(
      (sum, time) => sum + time,
      0
    )
    const totalTestTimeRounded = Math.round(totalTestTime)
    console.debug(
      `Total test time: ${totalTestTimeRounded} seconds (rounded). Split time cutoff: ${splitTestsCutoffTimeInSeconds} seconds.`
    )

    const shouldSplitTests =
      totalTestTimeRounded > parseInt(splitTestsCutoffTimeInSeconds)

    const fileContents = {
      'total-test-time': totalTestTimeRounded,
      'split-cutoff-time': parseInt(splitTestsCutoffTimeInSeconds),
      'split-tests': shouldSplitTests,
      packages: JSON.parse(jsonOfBalancedGroups)
    }

    const fileContentsAsJson = JSON.stringify(fileContents, null, 2)
    console.debug(`fileContentsAsJson: ${fileContentsAsJson}`)

    core.setOutput('json-file-contents', fileContentsAsJson)
  } catch (error) {
    core.error(`Error: ${error}`)
    return
  }
}
