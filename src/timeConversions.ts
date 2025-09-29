import { ParsedRow } from './seedTestLogParser.js'
// Function to convert time strings to seconds. Acceptable formats as inputs are:
// 1. 1m 23s
// 2. 1m 23.7s
// 3. 43s
// 4. 43.7s
// 5. 700ms  CHRISM cmoe back to info when done need anything async?
// Will add floats but return rounded to the nearest integer. No need for that level of precision.
/**
 * Creates balanced groups using greedy bin packing algorithm
 * @param {Array} items - Array of objects with {name, time} properties
 * @param {number} numGroups - Number of groups to create
 * @returns {Array} Array of group objects with fixtures array and totalTime
 */
function convertToSeconds(timeStr: string): number {
  if (!timeStr) return 0

  let totalSeconds = 0

  // Extract milliseconds if present (more specific, extract first)
  const msMatch = timeStr.match(/(\d+(?:\.\d+)?)ms/)
  if (msMatch) {
    totalSeconds += parseFloat(msMatch[1]) / 1000
  } else {
    // Extract minutes (if present)
    const minuteMatch = timeStr.match(/(\d+)m\s/)
    if (minuteMatch) {
      totalSeconds += parseInt(minuteMatch[1]) * 60
    }

    // Extract seconds (if present)
    const secondMatch = timeStr.match(/(\d+(?:\.\d+)?)s/)
    if (secondMatch) {
      totalSeconds += parseFloat(secondMatch[1])
    }
  }

  console.log(`Given String: ${timeStr}. Converted to seconds: ${totalSeconds}`)  

  return Math.round(totalSeconds)
}

//
// 1. 1m 23s
// 2. 1m 23.7s
// 3. 43s
// 4. 43.7s
// 5. 700ms  CHRISM check this one!!
// Will add floats but return rounded to the nearest integer. No need for that level of precision.
/** CHRISM come back to info when done
 * Function to convert time strings to seconds. Acceptable formats as inputs are:
 * @param {string} data - Array of objects with {name, time} properties
 * @param {number} numGroups - Number of groups to create
 * @returns {Array} Array of group objects with fixtures array and totalTime
 */
export function calculateTotalTimes(data: ParsedRow[]) {
  const totalTimes: Record<string, number> = {}

  for (const item of data) {
    const generationSeconds = convertToSeconds(String(item['GenerationTime']))
    const compileSeconds = convertToSeconds(String(item['CompileTime']))
    const totalSeconds = generationSeconds + compileSeconds

    // Store using the Name as the key
    totalTimes[item.Name] = totalSeconds
  }

  return totalTimes
}
