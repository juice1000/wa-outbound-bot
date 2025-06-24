const { google } = require('googleapis');
/**
 * Reads up to 20 rows from the worksheet where column "I" is empty
 * and column "E" contains a value like '+49 1' or '+491'.
 * Returns the filtered rows.
 * @param {object} sheet The sheet object from initGSheet
 * @returns {Promise<Array>} Filtered rows
 */
async function readRowsNoOutreach(sheet) {
  try {
    // Use the same auth client as used to fetch the sheet metadata
    const auth = sheet._authClient || sheet._sheetsApi?._options?.auth || sheet.sheetsApi?._options?.auth;
    if (!auth) {
      throw new Error('No valid Google Auth client found in sheet object.');
    }
    const spreadsheetId = sheet.spreadsheetId || process.env.GOOGLE_SPREADSHEET_ID;
    const worksheetName = sheet.properties.title;
    const sheets = google.sheets({ version: 'v4', auth });
    const range = `${worksheetName}`;
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const rows = res.data.values || [];
    if (rows.length === 0) {
      console.log('No data found.');
      return [];
    }

    // Find rows where column I (index 8) is empty and column E (index 4) matches phone pattern
    const filtered = rows
      .slice(1)
      .filter((r) => {
        const colIEmpty = !r[8] || r[8] === '';
        const colE = r[4] || '';
        const phoneMatch = colE.startsWith('+49 1') || colE.startsWith('+491');
        return colIEmpty && phoneMatch;
      })
      .slice(0, 20);
    return filtered;
  } catch (err) {
    console.error('Error reading Google Sheet:', err.message);
    return [];
  }
}

/**
 * Finds the row number (1-based, including header) for a given unique ID in column A.
 * @param {object} sheet - The Google Sheet object.
 * @param {string} uniqueId - The unique ID to search for in column A.
 * @returns {Promise<number|null>} The row number if found, otherwise null.
 */
async function findRowNumberByUniqueId(sheet, uniqueId) {
  // Use the same auth client as used to fetch the sheet metadata
  const auth = sheet._authClient || sheet._sheetsApi?._options?.auth || sheet.sheetsApi?._options?.auth;
  if (!auth) {
    throw new Error('No valid Google Auth client found in sheet object.');
  }
  const spreadsheetId = sheet.spreadsheetId || process.env.GOOGLE_SPREADSHEET_ID;
  const worksheetName = sheet.properties.title;
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: worksheetName,
  });
  const rows = res.data.values || [];
  let rowNumber = null;
  for (let i = 1; i < rows.length; i++) {
    // start at 1 to skip header
    if (rows[i][0] === uniqueId) {
      rowNumber = i + 1;
      break;
    }
  }
  if (!rowNumber) {
    throw new Error(`Row with uniqueId "${uniqueId}" not found.`);
  }
  return rowNumber;
}

module.exports = { readRowsNoOutreach, findRowNumberByUniqueId };
