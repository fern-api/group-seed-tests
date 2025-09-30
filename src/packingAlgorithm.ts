/**
 * Greedy Bin Packing Algorithm for Load Balancing
 *
 * This algorithm distributes items across a specified number of groups (bins)
 * to minimize the maximum total time/weight in any single group.
 *
 * Strategy: Always assign the next item to the group with the smallest current total.
 */
export function createBalancedGroups(
  items: { name: string; time: number }[],
  numGroups: number,
  addPackageForLeftovers: boolean,
) {
  // Initialize groups with empty arrays and zero total time
  const groups = Array.from({ length: numGroups }, () => ({
    fixtures: [] as string[],
    packageTotalTime: 0,
  }));

  // Sort items by time descending (largest first)
  // This helps achieve better balance by placing heavy items first
  const sortedItems = [...items].sort((a, b) => b.time - a.time);

  // For each item, add it to the group with the smallest current total time
  for (const item of sortedItems) {
    // Find group with minimum total time
    let minIndex = 0;
    let minTime = groups[0].packageTotalTime;

    for (let i = 1; i < groups.length; i++) {
      if (groups[i].packageTotalTime < minTime) {
        minTime = groups[i].packageTotalTime;
        minIndex = i;
      }
    }

    // Add item to the group with minimum time
    groups[minIndex].fixtures.push(item.name);
    groups[minIndex].packageTotalTime += item.time;
  }

  // Add a package for leftovers if addPackageForLeftovers is true. This will run any new test added since the last run of this packager.
  if (addPackageForLeftovers) {
    groups.push({
      fixtures: ["leftovers"],
      packageTotalTime: 0,
    });
  }

  return groups;
}
