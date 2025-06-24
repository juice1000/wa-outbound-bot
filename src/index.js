// install with: npm install whatsapp-web.js qrcode-terminal
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { initGSheetFromEnv } = require('./init_gsheet');
const { readRowsNoOutreach, findRowNumberByUniqueId } = require('./read_gsheet');
const { writeFirstOutreach } = require('./write_gsheet');
const { getNumberSeries } = require('./wa-client-utils');

const client = new Client();

client.on('qr', (qr) => qrcode.generate(qr, { small: true }));

client.on('ready', async () => {
  console.log('✅ Client ready');

  let sheet;
  try {
    sheet = await initGSheetFromEnv();
    console.log('Google Sheet loaded:', sheet.properties.title);
  } catch (err) {
    console.error('Failed to load Google Sheet:', err.message);
  }
  const rows = await readRowsNoOutreach(sheet);

  // Refactored from .forEach to for...of for proper async/await sequencing
  try {
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const number = row[4]; // Assuming column E is at index 4
      const numberId = await getNumberSeries(number, client);
      // Find row number based on unique ID in column A
      const uniqueId = row[0];
      const rowNumber = await findRowNumberByUniqueId(sheet, uniqueId);
      if (numberId) {
        console.log(`Row ${rowNumber} - Sanitized number ID:`, numberId._serialized);
      }
      const message = row[7];
      if (message) {
        await client.sendMessage(numberId._serialized, message);
        console.log(`Row ${rowNumber} - Sent message`);
      }
      await writeFirstOutreach(sheet, rowNumber);
      console.log(`Updated status row ${rowNumber} to 'first outreach'`);
      console.log('\n');
      // wait between 15 and 60 seconds before sending the next message
      const waitTime = Math.floor(Math.random() * (60000 - 15000 + 1)) + 15000; // Random wait between 15 and 60 seconds
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    console.log('All messages processed.');
    await client.logout();
    await client.destroy();
  } catch (err) {
    console.error('Error processing rows:', err.message);
  }
});

client.initialize();
