/**
 * Greedy Bin Grouping Algorithm for Load Balancing
 *
 * This algorithm distributes items across a specified number of groups (bins)
 * to minimize the maximum total time/weight in any single group.
 *
 * Strategy: Always assign the next item to the group with the smallest current total.
 */
export function createBalancedGroups(
  items: { name: string; time: number }[],
  numGroups: number,
) {
  // Initialize groups with empty arrays and zero total time
  const groups = Array.from({ length: numGroups }, () => ({
    fixtures: [] as string[],
    groupTotalTimeSeconds: 0,
  }));

  // Sort items by time descending (largest first)
  // This helps achieve better balance by placing heavy items first
  const sortedItems = [...items].sort((a, b) => b.time - a.time);

  // For each item, add it to the group with the smallest current total time
  for (const item of sortedItems) {
    // Find group with minimum total time
    let minIndex = 0;
    let minTime = groups[0].groupTotalTimeSeconds;

    for (let i = 1; i < groups.length; i++) {
      if (groups[i].groupTotalTimeSeconds < minTime) {
        minTime = groups[i].groupTotalTimeSeconds;
        minIndex = i;
      }
    }

    // Add item to the group with minimum time
    groups[minIndex].fixtures.push(item.name);
    groups[minIndex].groupTotalTimeSeconds += item.time;
  }

  return groups;
}
