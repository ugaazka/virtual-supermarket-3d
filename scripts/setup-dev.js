import { randomBytes } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const envPath = fileURLToPath(new URL('../.env', import.meta.url));
if (!existsSync(envPath)) {
  writeFileSync(envPath, [
    'PORT=3001',
    `JWT_SECRET=${randomBytes(48).toString('hex')}`,
    `ADMIN_PASSWORD=${randomBytes(18).toString('base64url')}`,
    '# Optional: MONGODB_URI=mongodb://127.0.0.1:27017/suuqverse',
    '',
  ].join('\n'), { mode: 0o600, flag: 'wx' });
  console.log('Created .env for local development. Find your admin password in .env.');
}
