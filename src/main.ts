import * as core from '@actions/core'
import { calculateTotalTimes } from './timeConversions.js'
import { createBalancedGroups } from './packingAlgorithm.js'
import { parseDataFromSeedTestAsciiTable } from './seedTestLogParser.js'
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
    console.debug(`extractedTableOfTests:\n${extractedTableOfTests}`)

    let extractedJsonData: string = await parseDataFromSeedTestAsciiTable(
      extractedTableOfTests
    )

    // Validate extracted json-data
    if (!extractedJsonData) {
      core.error('No data returned from parseTimesFromSeedTestAsciiTable')
      return
    }

    let parsedJson: string
    try {
      parsedJson = JSON.parse(extractedJsonData)
      core.debug(`JSON is parsable!`)
    } catch (parseError) {
      core.error(`Failed to parse JSON data: ${parseError}`)
      return
    }

    // Convert string time format into usable format and combine generation and compile times for a single time
    const result = calculateTotalTimes(parsedJson) // CHRISM - async await?
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
    // console.log(`\nTotal entries processed: ${Object.keys(result).length}`);

    // CHRISM - temporary, need to pass back to workflow to save to repo... maybe
    // Save to file
    fs.writeFileSync('balancedGroups.json', jsonOfBalancedGroups)
  } catch (error) {
    core.error(`Error: ${error}`)
    return
  }
}
