#!/usr/bin/env node

/**
 * GitHub Pages Setup Script for Liquid Glass Terminal
 * 
 * This script helps configure the repository for GitHub Pages deployment
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function updateViteConfig(repoName) {
  const viteConfigPath = path.join(process.cwd(), 'vite.config.ts');
  
  try {
    let content = fs.readFileSync(viteConfigPath, 'utf8');
    
    // Replace the placeholder with actual repo name
    content = content.replace(
      '/liquid-glass-ordering-terminal/', 
      `/${repoName}/`
    );
    
    fs.writeFileSync(viteConfigPath, content);
    console.log(`✅ Updated vite.config.ts with repository name: ${repoName}`);
  } catch (error) {
    console.error('❌ Error updating vite.config.ts:', error.message);
  }
}

async function main() {
  console.log('🚀 GitHub Pages Setup for Liquid Glass Dashboard\n');
  console.log('Current configuration: moarbetsy/liquid-glass-dashboard\n');
  
  const confirm = await question('Use current configuration? (y/n): ');
  
  if (confirm.toLowerCase() !== 'y') {
    const repoName = await question('Enter your GitHub repository name: ');
    if (repoName) {
      await updateViteConfig(repoName);
    }
  } else {
    console.log('✅ Using current configuration: liquid-glass-dashboard');
  }
  
  console.log('\n✅ Setup complete!\n');
  console.log('Next steps:');
  console.log('1. Run: ./deploy.sh');
  console.log('2. Enable GitHub Pages in repository settings (Source: GitHub Actions)');
  console.log('3. Your app will be available at: https://moarbetsy.github.io/liquid-glass-dashboard/\n');
  
  rl.close();
}

main().catch(console.error);