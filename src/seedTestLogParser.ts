// Return JSON string of data
export interface ParsedRow {
  Name: string
  OutputFolder: string
  GenerationTime: string
  CompileTime: string
}

export async function parseDataFromSeedTestAsciiTable(
  input: string
): Promise<ParsedRow[]> {
  // Strip any ANSI escape sequences when reading in data
  const lines = input
    .trim()
    .replace(/\x1b\[[0-9;]*m/g, '')
    .split('\n')

  // Find the header line (contains column names)
  let headerLineIndex = -1

  for (let i = 0; i < lines.length; i++) {
    // let line = lines[i]
    if (
      lines[i].includes('Name') &&
      lines[i].includes('Output Folder') &&
      lines[i].includes('Result') &&
      lines[i].includes('Generation Time') &&
      lines[i].includes('Compile Time')
    ) {
      headerLineIndex = i
      break
    }
  }

  if (headerLineIndex === -1) {
    throw new Error('Could not find header row of seed test table')
  }

  // Parse column positions from the separator line
  const headerLine = lines[headerLineIndex]
  const columnPositions: number[] = []

  // Find column headers between two separators ( | )
  for (let i = 0; i < headerLine.length; i++) {
    if (headerLine[i] === '│') {
      columnPositions.push(i)
    }
  }

  // Extract header data between found column separators
  const headers: string[] = []
  for (let i = 0; i < columnPositions.length - 1; i++) {
    const start = columnPositions[i]
    const end = columnPositions[i + 1]
    const header = headerLine.substring(start, end).replace('│', '').trim()
    headers.push(header)
  }

  console.log(`headers: ${headers}`)

  // Find the indices of the columns we want
  const nameIndex = headers.findIndex((h) => h === 'Name')
  const outputFolderIndex = headers.findIndex((h) => h === 'Output Folder')
  const generationTimeIndex = headers.findIndex((h) => h === 'Generation Time')
  const compileTimeIndex = headers.findIndex((h) => h === 'Compile Time')

  console.log(`nameIndex: ${nameIndex}`)
  console.log(`outputFolderIndex: ${outputFolderIndex}`)
  console.log(`generationTimeIndex: ${generationTimeIndex}`)
  console.log(`compileTimeIndex: ${compileTimeIndex}`)

  if (
    nameIndex === -1 ||
    outputFolderIndex === -1 ||
    generationTimeIndex === -1 ||
    compileTimeIndex === -1
  ) {
    throw new Error(
      'Could not find all required header columns of seed test table'
    )
  }

  const results: ParsedRow[] = []

  // Parse data rows (start after the separator line which is after the header line)
  for (let i = headerLineIndex + 2; i < lines.length; i++) {
    const line = lines[i]

    // Skip lines that don't look like data rows (e.g., bottom border)
    if (!line.includes('│') || line.startsWith('└')) {
      continue
    }

    const rowData: string[] = []

    // Extract each row of data (test information)
    for (let j = 0; j < columnPositions.length - 1; j++) {
      const start = columnPositions[j]
      const end = columnPositions[j + 1]
      const value = line.substring(start, end).replace('│', '').trim()
      rowData.push(value)
    }

    // Error if any expected data is missing
    if (!rowData[nameIndex]) throw new Error(`Missing Name data in row ${i}`)
    if (!rowData[outputFolderIndex])
      throw new Error(`Missing OutputFolder data in row ${i}`)
    if (!rowData[generationTimeIndex])
      throw new Error(`Missing GenerationTime data in row ${i}`)
    if (!rowData[compileTimeIndex])
      throw new Error(`Missing CompileTime data in row ${i}`)

    const parsedRow: ParsedRow = {
      Name: rowData[nameIndex],
      OutputFolder: rowData[outputFolderIndex],
      GenerationTime: rowData[generationTimeIndex],
      CompileTime: rowData[compileTimeIndex]
    }

    results.push(parsedRow)
  }

  return results //JSON.stringify(results, null, 2)
}
