#!/usr/bin/env node

/**
 * Show current subgraph deployment status and configuration
 */

const fs = require('fs');
const path = require('path');

const STUDIO_URLS = {
  'dev/staging': 'https://thegraph.com/studio/subgraph/eternalmint-pro-staging/', 
  production: 'https://thegraph.com/studio/subgraph/eternalmint-pro/'
};

function showStatus() {
  console.log('📊 EternalMint Pro Subgraph Status\n');
  
  // Read networks.json
  const networksPath = path.join(__dirname, 'networks.json');
  const networks = JSON.parse(fs.readFileSync(networksPath, 'utf8'));
  
  // Show current configuration
  console.log('🔧 Current Configuration:');
  console.log('┌─────────────────┬──────────────────┬─────────────────────────────────────────────┬─────────────┐');
  console.log('│ Environment     │ Network          │ Contract Address                            │ Start Block │');
  console.log('├─────────────────┼──────────────────┼─────────────────────────────────────────────┼─────────────┤');
  
  const chronosConfig = networks['autonomys-chronos']?.EternalMintNfts;
  const mainnetConfig = networks['autonomys-mainnet']?.EternalMintNfts;
  
  console.log(`│ Dev/Staging     │ autonomys-chronos│ ${chronosConfig?.address || 'Not set'} │ ${chronosConfig?.startBlock || 'Not set'} │`);
  console.log(`│ Production      │ autonomys-mainnet│ ${mainnetConfig?.address || 'Not set'} │ ${mainnetConfig?.startBlock || 'Not set'} │`);
  console.log('└─────────────────┴──────────────────┴─────────────────────────────────────────────┴─────────────┘\n');
  
  // Show deployment commands
  console.log('🚀 Quick Deployment Commands:');
  console.log('');
  console.log('# Deploy existing configuration:');
  console.log('yarn deploy:dev');
  console.log('yarn deploy:staging');
  console.log('yarn deploy:production');
  console.log('');
  console.log('# Deploy with new contract:');
  console.log('node deploy.js dev 0x1234... 123456');
  console.log('node deploy.js staging 0x1234... 123456');
  console.log('node deploy.js production 0x1234... 123456');
  console.log('');
  
  // Show studio URLs
  console.log('🌐 The Graph Studio URLs:');
  Object.entries(STUDIO_URLS).forEach(([env, url]) => {
    console.log(`${env.padEnd(12)}: ${url}`);
  });
  console.log('');
  
  // Show validation
  console.log('✅ Run validation: yarn validate');
  console.log('📋 View this status: node status.js');
}

if (require.main === module) {
  showStatus();
}

module.exports = { showStatus };
