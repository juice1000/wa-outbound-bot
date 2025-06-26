// install with: npm install whatsapp-web.js qrcode-terminal
const { Client, MessageMedia } = require('whatsapp-web.js');
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

  for (let index = 0; index < rows.length; index++) {
    try {
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
        const media = MessageMedia.fromFilePath('/Users/julienlook/Documents/Coding/wa-outbound-bot/data/image.png');
        await client.sendMessage(numberId._serialized, message, { media });
        console.log(`Row ${rowNumber} - Sent message`);
      }
      await writeFirstOutreach(sheet, rowNumber);
      console.log(`Updated status row ${rowNumber} to 'first outreach'`);
      // wait between 60 and 180 seconds before sending the next message
      const waitTime = Math.floor(Math.random() * (180000 - 60000 + 1)) + 60000;
      console.log('waiting for', waitTime / 1000, 'seconds before next message');
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      console.log('\n');
    } catch (err) {
      console.error(`Error processing row ${index + 1}:`, err.message);
    }
  }
  console.log('All messages processed.');
  await client.logout();
  await client.destroy();
});

client.initialize();
