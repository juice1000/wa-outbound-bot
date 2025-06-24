const { google } = require('googleapis');
/**
 * Updates column "I" (index 8) of the row matching uniqueId in column A to "first outreach".
 * @param {object} sheet The sheet object from initGSheet
 * @param {string} rowNumber
 * @returns {Promise<void>}
 */
async function writeFirstOutreach(sheet, rowNumber) {
  const auth = sheet._authClient;
  const spreadsheetId = sheet.spreadsheetId;
  const worksheetName = sheet.properties.title;
  const sheets = google.sheets({ version: 'v4', auth });

  const range = `${worksheetName}!I${rowNumber}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    requestBody: { values: [['first outreach']] },
  });
}

module.exports = { writeFirstOutreach };
