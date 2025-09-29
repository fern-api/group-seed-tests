/**
 * Greedy Bin Packing Algorithm for Load Balancing
 *
 * This algorithm distributes items across a specified number of groups (bins)
 * to minimize the maximum total time/weight in any single group.
 *
 * Strategy: Always assign the next item to the group with the smallest current total.
 */

/**
 * Creates balanced groups using greedy bin packing algorithm
 * @param {Array} items - Array of objects with {name, time} properties
 * @param {number} numGroups - Number of groups to create
 * @returns {Array} Array of group objects with fixtures array and totalTime
 */
export function createBalancedGroups(
  items: { name: string; time: number }[],
  numGroups: number
) {
  // CHRISM - async await?
  // Initialize groups with empty arrays and zero total time
  const groups = Array.from({ length: numGroups }, () => ({
    fixtures: [] as string[],
    totalTime: 0
  }))

  // Sort items by time descending (largest first)
  // This helps achieve better balance by placing heavy items first
  const sortedItems = [...items].sort((a, b) => b.time - a.time)

  // For each item, add it to the group with the smallest current total time
  for (const item of sortedItems) {
    // Find group with minimum total time
    let minIndex = 0
    let minTime = groups[0].totalTime

    for (let i = 1; i < groups.length; i++) {
      if (groups[i].totalTime < minTime) {
        minTime = groups[i].totalTime
        minIndex = i
      }
    }

    // Add item to the group with minimum time
    groups[minIndex].fixtures.push(item.name)
    groups[minIndex].totalTime += item.time
  }

  return groups
}

// /**
//  * Process raw table data and consolidate by name
//  * @param {string} rawData - Tab-separated table data
//  * @returns {Array} Array of consolidated items with {name, time} properties
//  */
// function processTableData(rawData) {
//     const nameToTotalTime = new Map();

//     // Parse each line and accumulate times by name
//     rawData.split('\n').forEach(line => {
//         const [name, outputFolder, result, genTime, compileTime] = line.split('\t');
//         const totalTime = parseTimeToSeconds(genTime) + parseTimeToSeconds(compileTime);
//         const current = nameToTotalTime.get(name.trim()) || 0;
//         nameToTotalTime.set(name.trim(), current + totalTime);
//     });

//     // Convert to sorted array (largest first for better bin packing)
//     return Array.from(nameToTotalTime.entries())
//         .map(([name, time]) => ({ name, time }))
//         .sort((a, b) => b.time - a.time);
// }

// /**
//  * Analyze the balance quality of the groups
//  * @param {Array} groups - Array of group objects with totalTime property
//  * @returns {Object} Balance statistics
//  */
// function analyzeBalance(groups) {
//     const totalTimes = groups.map(g => g.totalTime);
//     const minTime = Math.min(...totalTimes);
//     const maxTime = Math.max(...totalTimes);
//     const avgTime = totalTimes.reduce((a, b) => a + b, 0) / totalTimes.length;
//     const range = maxTime - minTime;
//     const efficiency = ((1 - range / maxTime) * 100);

//     return {
//         minTime,
//         maxTime,
//         avgTime,
//         range,
//         efficiency
//     };
// }

// /**
//  * Generate bash variable code from groups
//  * @param {Array} groups - Array of group objects
//  * @returns {string} Bash variable assignment code
//  */
// function generateBashCode(groups) {
//     const bashVariable = groups.map(group => ({
//         fixtures: group.fixtures
//     }));

//     return `BASH_VAR='${JSON.stringify(bashVariable)}'`;
// }

// // Example usage:
// const exampleData = `item1	--	success	3m 5.4s	2m 50.9s
// item2	--	success	3m 4.2s	3m 25.2s
// item3	config1	failure	50.4s	1m 9.2s
// item3	config2	success	2m 2.7s	4m 4.8s`;

// // Process the data
// const items = processTableData(exampleData);

// // Create balanced groups
// const groups = createBalancedGroups(items, 3);

// // Analyze balance
// const stats = analyzeBalance(groups);

// // Generate bash code
// const bashCode = generateBashCode(groups);

// console.log('Processed Items:', items);
// console.log('Balanced Groups:', groups);
// console.log('Balance Stats:', stats);
// console.log('Bash Code:', bashCode);
