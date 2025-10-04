#!/usr/bin/env node

/**
 * Streamlined subgraph deployment script
 * 
 * Usage:
 *   node deploy.js <environment> [contract-address] [start-block]
 * 
 * Examples:
 *   node deploy.js dev
 *   node deploy.js staging 0x1234... 123456
 *   node deploy.js production
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const ENVIRONMENTS = {
  dev: {
    network: 'autonomys-chronos',
    studioSlug: 'eternalmint-pro-staging', // Shared with staging
    configFile: 'subgraph.staging.yaml'
  },
  staging: {
    network: 'autonomys-chronos', 
    studioSlug: 'eternalmint-pro-staging',
    configFile: 'subgraph.staging.yaml'
  },
  production: {
    network: 'autonomys-mainnet',
    studioSlug: 'eternalmint-pro',
    configFile: 'subgraph.production.yaml'
  }
};

function updateNetworksJson(environment, contractAddress, startBlock) {
  const networksPath = path.join(__dirname, 'networks.json');
  const networks = JSON.parse(fs.readFileSync(networksPath, 'utf8'));
  
  const config = ENVIRONMENTS[environment];
  const networkKey = config.network;
  
  if (!networks[networkKey]) {
    networks[networkKey] = {};
  }
  
  if (!networks[networkKey].EternalMintNfts) {
    networks[networkKey].EternalMintNfts = {};
  }
  
  if (contractAddress) {
    networks[networkKey].EternalMintNfts.address = contractAddress;
    console.log(`✅ Updated contract address for ${networkKey}: ${contractAddress}`);
  }
  
  if (startBlock) {
    networks[networkKey].EternalMintNfts.startBlock = parseInt(startBlock);
    console.log(`✅ Updated start block for ${networkKey}: ${startBlock}`);
  }
  
  fs.writeFileSync(networksPath, JSON.stringify(networks, null, 2));
  console.log(`✅ Updated networks.json`);
}

function updateSubgraphConfig(environment, contractAddress, startBlock) {
  const config = ENVIRONMENTS[environment];
  const configPath = path.join(__dirname, config.configFile);
  
  if (!fs.existsSync(configPath)) {
    console.error(`❌ Config file not found: ${config.configFile}`);
    process.exit(1);
  }
  
  let content = fs.readFileSync(configPath, 'utf8');
  
  if (contractAddress) {
    content = content.replace(
      /address: "[^"]*"/,
      `address: "${contractAddress}"`
    );
    console.log(`✅ Updated contract address in ${config.configFile}`);
  }
  
  if (startBlock) {
    content = content.replace(
      /startBlock: \d+/,
      `startBlock: ${startBlock}`
    );
    console.log(`✅ Updated start block in ${config.configFile}`);
  }
  
  fs.writeFileSync(configPath, content);
}

function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: __dirname });
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

function main() {
  const [,, environment, contractAddress, startBlock] = process.argv;
  
  if (!environment || !ENVIRONMENTS[environment]) {
    console.error('❌ Usage: node deploy.js <environment> [contract-address] [start-block]');
    console.error('❌ Valid environments:', Object.keys(ENVIRONMENTS).join(', '));
    process.exit(1);
  }
  
  const config = ENVIRONMENTS[environment];
  
  console.log(`\n🚀 Deploying subgraph for ${environment} environment`);
  console.log(`📋 Network: ${config.network}`);
  console.log(`📋 Studio Slug: ${config.studioSlug}`);
  console.log(`📋 Config File: ${config.configFile}`);
  
  // Update configuration if new contract details provided
  if (contractAddress || startBlock) {
    console.log('\n📝 Updating configuration...');
    updateNetworksJson(environment, contractAddress, startBlock);
    updateSubgraphConfig(environment, contractAddress, startBlock);
  }
  
  // Generate code - dev uses staging config
  const buildEnv = environment === 'dev' ? 'staging' : environment;
  runCommand(`yarn codegen:${buildEnv}`, 'Generating code');
  
  // Build subgraph
  runCommand(`yarn build:${buildEnv}`, 'Building subgraph');
  
  // Deploy to The Graph Studio
  console.log(`\n🔄 Ready for deployment to The Graph Studio!`);
  console.log(`📋 Run the following command to deploy:`);
  console.log(`📋 graph deploy ${config.studioSlug} ${config.configFile}`);
  console.log(`\n💡 Make sure you're authenticated first:`);
  console.log(`💡 graph auth`);
  
  console.log(`\n✅ Build completed successfully for ${environment}!`);
  console.log(`📊 After deployment, view at: https://thegraph.com/studio/subgraph/${config.studioSlug}/`);
}

if (require.main === module) {
  main();
}

module.exports = { ENVIRONMENTS, updateNetworksJson, updateSubgraphConfig };
