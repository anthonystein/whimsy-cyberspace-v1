const crypto = require('node:crypto');
const readline = require('node:readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
process.stdout.write('Enter the new admin passphrase (input will be visible): ');
rl.once('line', passphrase => {
  rl.close();
  if (passphrase.length < 12) {
    console.error('Use at least 12 characters. A longer, unique phrase is better.');
    process.exitCode = 1;
    return;
  }
  const cost = 32768;
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(passphrase, salt, 32, { N: cost, r: 8, p: 1, maxmem: 256 * 1024 * 1024 });
  console.log(`\nWHIMSY_ADMIN_KEY_HASH=scrypt$${cost}$${salt.toString('base64url')}$${hash.toString('base64url')}`);
  console.log(`WHIMSY_SESSION_SECRET=${crypto.randomBytes(32).toString('base64url')}`);
});
