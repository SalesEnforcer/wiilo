const fs = require('fs');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Get the API URL from the environment (Render sets this)
// Fallback to empty string to prevent crashing if missing
const apiUrl = process.env.API_URL || '';

if (!apiUrl) {
  console.error('? Error: API_URL environment variable is missing!');
  process.exit(1);
}

const envConfigFile = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}'
};
`;

// Write the file
const targetPath = './src/environments/environment.prod.ts';

fs.writeFile(targetPath, envConfigFile, function (err) {
  if (err) {
    console.log(err);
  }
  console.log(`? Output generated at ${targetPath}`);
  console.log(`?? API URL set to: ${apiUrl}`);
});
