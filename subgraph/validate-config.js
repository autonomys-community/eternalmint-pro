#!/usr/bin/env node

/**
 * Validate subgraph configuration files
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILES = [
  'subgraph.staging.yaml', 
  'subgraph.production.yaml'
];

const EXPECTED_NETWORKS = {
  'subgraph.staging.yaml': 'autonomys-chronos',
  'subgraph.production.yaml': 'autonomys-mainnet'
};

function validateConfig() {
  console.log('🔍 Validating subgraph configuration...\n');
  
  let hasErrors = false;
  
  // Check if all config files exist
  for (const file of CONFIG_FILES) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Missing config file: ${file}`);
      hasErrors = true;
      continue;
    }
    
    // Read and validate content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check network
    const networkMatch = content.match(/network: (.+)/);
    if (!networkMatch) {
      console.error(`❌ ${file}: No network specified`);
      hasErrors = true;
      continue;
    }
    
    const network = networkMatch[1].trim();
    const expectedNetwork = EXPECTED_NETWORKS[file];
    
    if (network !== expectedNetwork) {
      console.error(`❌ ${file}: Expected network '${expectedNetwork}', got '${network}'`);
      hasErrors = true;
    } else {
      console.log(`✅ ${file}: Network '${network}' ✓`);
    }
    
    // Check contract address
    const addressMatch = content.match(/address: "([^"]+)"/);
    if (!addressMatch) {
      console.error(`❌ ${file}: No contract address specified`);
      hasErrors = true;
    } else {
      const address = addressMatch[1];
      if (!address.startsWith('0x') || address.length !== 42) {
        console.error(`❌ ${file}: Invalid contract address format: ${address}`);
        hasErrors = true;
      } else {
        console.log(`✅ ${file}: Contract address '${address}' ✓`);
      }
    }
    
    // Check start block
    const blockMatch = content.match(/startBlock: (\d+)/);
    if (!blockMatch) {
      console.error(`❌ ${file}: No start block specified`);
      hasErrors = true;
    } else {
      const startBlock = parseInt(blockMatch[1]);
      if (startBlock <= 0) {
        console.error(`❌ ${file}: Invalid start block: ${startBlock}`);
        hasErrors = true;
      } else {
        console.log(`✅ ${file}: Start block ${startBlock} ✓`);
      }
    }
  }
  
  // Check networks.json
  const networksPath = path.join(__dirname, 'networks.json');
  if (!fs.existsSync(networksPath)) {
    console.error(`❌ Missing networks.json`);
    hasErrors = true;
  } else {
    try {
      const networks = JSON.parse(fs.readFileSync(networksPath, 'utf8'));
      
      // Check required networks
      const requiredNetworks = ['autonomys-chronos', 'autonomys-mainnet'];
      for (const network of requiredNetworks) {
        if (!networks[network]) {
          console.error(`❌ networks.json: Missing network '${network}'`);
          hasErrors = true;
        } else if (!networks[network].EternalMintNfts) {
          console.error(`❌ networks.json: Missing EternalMintNfts config for '${network}'`);
          hasErrors = true;
        } else {
          const config = networks[network].EternalMintNfts;
          if (!config.address || !config.startBlock) {
            console.error(`❌ networks.json: Incomplete config for '${network}'`);
            hasErrors = true;
          } else {
            console.log(`✅ networks.json: ${network} configuration ✓`);
          }
        }
      }
    } catch (error) {
      console.error(`❌ networks.json: Invalid JSON format`);
      hasErrors = true;
    }
  }
  
  console.log('');
  
  if (hasErrors) {
    console.error('❌ Configuration validation failed!');
    process.exit(1);
  } else {
    console.log('🎉 All configurations are valid!');
  }
}

if (require.main === module) {
  validateConfig();
}

module.exports = { validateConfig };
