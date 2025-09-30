import * as core from "@actions/core";
import { calculateTotalTimes } from "./timeConversions.js";
import { createBalancedGroups } from "./packingAlgorithm.js";
import {
  parseDataFromSeedTestAsciiTable,
  ParsedRow,
} from "./seedTestLogParser.js";
import fs from "fs";

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    core.info("Starting seed test packaging");
    const seedGeneratorAliasInput: string = core.getInput(
      "seed-generator-alias",
    );
    const numberOfPackagesInput: string = core.getInput("number-of-packages");
    const addPackageForLeftoversInput: string = core.getInput(
      "add-package-for-leftovers",
    );
    const splitTestsCutoffTimeInSecondsInput: string = core.getInput(
      "split-tests-cutoff-time-in-seconds",
    );
    const seedTestLogFilePath: string = core.getInput(
      "seed-test-log-file-path",
    );

    // Start by validating inputs
    // Validate seed-generator-alias
    if (seedGeneratorAliasInput) {
      core.debug(`Seed generator alias: ${seedGeneratorAliasInput}`);
    } else {
      core.error("No seed-generator-alias provided");
      return;
    }

    // Validate number-of-packages
    let numberOfPackages: number = 0;
    if (numberOfPackagesInput) {
      numberOfPackages = parseInt(numberOfPackagesInput);
      core.debug(`Number of packages: ${numberOfPackages}`);
    } else {
      core.error("No number-of-packages provided");
      return;
    }

    // Validate add-package-for-leftovers
    let addPackageForLeftovers: boolean = false;
    if (addPackageForLeftoversInput) {
      addPackageForLeftovers = addPackageForLeftoversInput === "true";
      core.debug(`Add package for leftovers: ${addPackageForLeftovers}`);
    } else {
      core.error("No add-package-for-leftovers provided");
      return;
    }

    // Validate split-tests-cutoff-time-in-seconds
    let splitTestsCutoffTimeInSeconds: number = 0;
    if (splitTestsCutoffTimeInSecondsInput) {
      splitTestsCutoffTimeInSeconds = parseInt(
        splitTestsCutoffTimeInSecondsInput,
      );
      core.debug(
        `Split tests cutoff time in seconds: ${splitTestsCutoffTimeInSeconds}`,
      );
    } else {
      core.error("No split-tests-cutoff-time-in-seconds provided");
      return;
    }

    // Validate seed-test-log-file-path
    if (seedTestLogFilePath) {
      if (fs.existsSync(seedTestLogFilePath)) {
        core.debug(`Seed test log file path exists: ${seedTestLogFilePath}`);
      } else {
        core.error(
          `Provided seed-test-log-file-path does not exist: ${seedTestLogFilePath}`,
        );
        return;
      }
    } else {
      core.error("No seed test log provided");
      return;
    }

    // Parse table of tests and times out from seed test log file
    let extractedTableOfTests: string = "";
    try {
      const fileContent = fs.readFileSync(seedTestLogFilePath, "utf-8");
      // TODO FER-6948: make parsing more robust with tags like mentioned in ticket
      const startTag: string = "┌──────";
      const endTag: string = "test cases";
      const startIndex: number = fileContent.indexOf(startTag);
      const endIndex: number = fileContent.indexOf(
        endTag,
        startIndex + startTag.length,
      );

      if (startIndex !== -1 && endIndex !== -1) {
        extractedTableOfTests = fileContent.substring(
          startIndex + startTag.length,
          endIndex,
        );
      } else {
        console.log(
          `Table parsing delimiters not found in ${seedTestLogFilePath} or in incorrect order.`,
        );
      }
    } catch (error) {
      console.error("Error reading seed test log file:", error);
    }
    console.log("Successfully parsed test table from test log file!");

    // Parse row data from table of tests and times
    const extractedJsonData: ParsedRow[] =
      await parseDataFromSeedTestAsciiTable(extractedTableOfTests);

    // Validate extracted json-data
    if (!extractedJsonData) {
      core.error("No data returned from parseTimesFromSeedTestAsciiTable");
      return;
    }

    // Convert string time format into usable format and combine generation and compile times for a single time
    const result = calculateTotalTimes(extractedJsonData);
    const jsonOfTestTotalTimes = JSON.stringify(result, null, 2);
    console.debug(`jsonOfTestTotalTimes: ${jsonOfTestTotalTimes}`);
    console.log(`\nTotal entries processed: ${Object.keys(result).length}`);

    // Convert result object to array format for createBalancedGroups
    const itemsArray = Object.entries(result).map(([name, time]) => ({
      name: name,
      time: time,
    }));

    // Package the tests into balanced groups
    const balancedGroups = createBalancedGroups(
      itemsArray,
      numberOfPackages,
      addPackageForLeftovers,
    );
    const jsonOfBalancedGroups = JSON.stringify(balancedGroups, null, 2);
    console.debug(`jsonOfBalancedGroups: ${jsonOfBalancedGroups}`);

    const totalTestTime = Object.values(result).reduce(
      (sum, time) => sum + time,
      0,
    );
    const totalTestTimeRounded = Math.round(totalTestTime);
    console.debug(
      `Total test time: ${totalTestTimeRounded} seconds (rounded). Split time cutoff: ${splitTestsCutoffTimeInSeconds} seconds.`,
    );

    const shouldSplitTests =
      totalTestTimeRounded > splitTestsCutoffTimeInSeconds;

    const fileContents = {
      "total-test-time": totalTestTimeRounded,
      "split-cutoff-time": splitTestsCutoffTimeInSeconds,
      "split-tests": shouldSplitTests,
      packages: JSON.parse(jsonOfBalancedGroups),
    };

    const fileContentsAsJson = JSON.stringify(fileContents, null, 2);
    console.debug(`fileContentsAsJson: ${fileContentsAsJson}`);

    core.setOutput("json-file-contents", fileContentsAsJson);
  } catch (error) {
    core.error(`Error: ${error}`);
    return;
  }
}
