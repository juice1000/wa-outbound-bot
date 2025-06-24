const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');
const { readRowsNoOutreach, findRowNumberByUniqueId } = require('./read_gsheet');
require('dotenv').config(); // Load environment variables from .env file
/**
 * Initializes and returns a Google Sheets worksheet reference.
 * @param {string} serviceAccountFile Path to the Google service account JSON file.
 * @param {string} spreadsheetId The ID of the Google Spreadsheet.
 * @param {string} worksheetName Name of the worksheet to access.
 * @returns {Promise<object>} The worksheet reference (sheet metadata).
 */
async function initGSheet(serviceAccountFile, spreadsheetId, worksheetName) {
  const auth = new GoogleAuth({
    keyFile: serviceAccountFile,
    scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  // Get spreadsheet metadata to find the sheetId by worksheetName
  const res = await sheets.spreadsheets.get({
    spreadsheetId,
  });

  const sheet = res.data.sheets.find((s) => s.properties && s.properties.title === worksheetName);

  if (!sheet) {
    throw new Error(`Worksheet "${worksheetName}" not found.`);
  }

  // Attach auth and spreadsheetId for downstream use
  sheet._authClient = client;
  sheet.spreadsheetId = spreadsheetId;

  return sheet;
}

// Helper to use env variables
async function initGSheetFromEnv() {
  const serviceAccountFile = process.env.GOOGLE_SERVICE_ACCOUNT_FILE;
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const worksheetName = process.env.GOOGLE_WORKSHEET_NAME;

  return await initGSheet(serviceAccountFile, spreadsheetId, worksheetName);
}

/**
 * Test function to check Google Sheets connectivity and read_gsheet logic.
 * Logs the worksheet title and filtered rows if successful.
 */
async function testGSheetConnectivity() {
  try {
    const sheet = await initGSheetFromEnv();
    console.log('✅ Connected to Google Sheet:', sheet.properties.title);
    const rows = await readRowsNoOutreach(sheet);

    console.log('Filtered rows:', rows);
    if (rows.length > 0) {
      // Find the row number in the sheet for the first filtered row
      const rowIndex = await findRowNumberByUniqueId(sheet, '3713');
      if (rowIndex !== -1) {
        const rowNumber = rowIndex + 2; // +2 for header offset
        // Use writeFirstOutreach from write_gsheet.js
        const { writeFirstOutreach } = require('./write_gsheet');
        await writeFirstOutreach(sheet, rowNumber);
        console.log(`Updated row ${rowNumber} column I to 'first outreach' (test)`);
      } else {
        console.log('First filtered row not found in sheet data.');
      }
    } else {
      console.log('No filtered rows to update.');
    }
    return true;
  } catch (err) {
    console.error('❌ Google Sheet connection failed:', err.message);
    return false;
  }
}

// Export for manual testing
if (require.main === module) {
  testGSheetConnectivity();
}

module.exports = { initGSheetFromEnv, testGSheetConnectivity };
