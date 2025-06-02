const fs = require("fs");

// Load your original service account JSON
const key = require("./service-account.json");

// Fix private_key: escape every newline
key.private_key = key.private_key.replace(/\n/g, "\\n");

// Convert to one-line JSON string
const envLine = `FIREBASE_SERVICE_ACCOUNT_KEY=${JSON.stringify(key)}`;

// Write to file
fs.writeFileSync(".env-ready.txt", envLine);

console.log(
  "✅ .env-ready.txt generated. Paste this into your .env.local or Vercel env."
);