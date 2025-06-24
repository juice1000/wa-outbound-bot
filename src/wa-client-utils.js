/**
 * Sanitizes a phone number for WhatsApp usage.
 * Removes spaces, plus sign, and keeps only digits, ensuring country code is included.
 * Example: '+49 155 60176834' => '4915560176834'
 * @param {string} number
 * @returns {string}
 */
function sanitizeNumber(number) {
  if (number.startsWith('0')) {
    number = number.slice(1);
  }
  if (!number.startsWith('49')) {
    number = '49' + number;
  }
  return number.replace(/\D/g, '');
}

async function getNumberSeries(number, client) {
  if (!number || typeof number !== 'string') {
    console.error('Invalid phone number provided:', number);
    return;
  }
  const sanitizedNumber = sanitizeNumber(number);
  return await client.getNumberId(sanitizedNumber);
}

module.exports = { getNumberSeries };
