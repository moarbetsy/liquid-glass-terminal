#!/usr/bin/env node

/**
 * Password Hash Generator for Liquid Glass Terminal
 * 
 * Usage: node scripts/generate-password-hash.js [password]
 * 
 * If no password is provided, it will prompt for input.
 */

const crypto = require('crypto');
const readline = require('readline');

async function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function promptPassword() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Enter password to hash: ', (password) => {
      rl.close();
      resolve(password);
    });
  });
}

async function main() {
  let password = process.argv[2];
  
  if (!password) {
    password = await promptPassword();
  }

  if (!password) {
    console.error('Error: No password provided');
    process.exit(1);
  }

  const hash = await hashPassword(password);
  
  console.log('\n--- Password Hash Generated ---');
  console.log(`Password: ${password}`);
  console.log(`SHA-256 Hash: ${hash}`);
  console.log('\nAdd this to your USERS object in LoginPage.tsx:');
  console.log(`'username': '${hash}',`);
  console.log('');
}

main().catch(console.error);