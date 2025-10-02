# EternalMint Pro Subgraph Deployment Guide

This guide covers deploying and managing subgraphs for EternalMint Pro using The Graph Studio with official Autonomys network support.

## Table of Contents

- [Prerequisites](#prerequisites)
- [First-Time Setup](#first-time-setup)
- [Deployment Environments](#deployment-environments)
- [Initial Deployment](#initial-deployment)
- [Updating After Contract Changes](#updating-after-contract-changes)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- [Node.js](https://nodejs.org/) v16+ installed
- [Yarn](https://yarnpkg.com/) or npm package manager
- Access to [The Graph Studio](https://thegraph.com/studio/)
- Wallet connected to The Graph Studio
- EternalMint Pro contract deployed on target network

## First-Time Setup

### 1. Clone Repository and Install Dependencies

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd eternalmint-pro/subgraph

# Install dependencies
yarn install
# or
npm install

# Install Graph CLI globally
yarn global add @graphprotocol/graph-cli
# or
npm install -g @graphprotocol/graph-cli
```

### 2. Create Subgraphs in The Graph Studio

1. Go to [The Graph Studio](https://thegraph.com/studio/)
2. Connect your wallet
3. Create the following subgraphs:
   - **Development**: `eternalmint-pro-dev`
   - **Staging**: `eternalmint-pro-staging` 
   - **Production**: `eternalmint-pro`

4. Note your deploy keys for each subgraph

### 3. Authenticate with The Graph Studio

```bash
# Authenticate using your deploy key
yarn auth
# Enter your deploy key when prompted

# Or authenticate directly
graph auth --studio <YOUR_DEPLOY_KEY>
```

## Deployment Environments

### Current Configuration

| Environment | Network | Contract Address | Start Block |
|-------------|---------|------------------|-------------|
| Development | `autonomys-chronos` | `0x2601FB64e5cA137f273Fa64c28056a040d132A1b` | `282110` |
| Staging | `autonomys-chronos` | `0x2601FB64e5cA137f273Fa64c28056a040d132A1b` | `282110` |
| Production | `autonomys-mainnet` | `0x2601FB64e5cA137f273Fa64c28056a040d132A1b` | `282110` |

### Configuration Files

- **Development**: `subgraph.yaml`
- **Staging**: `subgraph.staging.yaml`
- **Production**: `subgraph.production.yaml`

## Initial Deployment

### Step 1: Generate Code and Build

```bash
# Generate TypeScript code from schema and ABIs
yarn codegen

# Build the subgraph
yarn build
```

### Step 2: Deploy to Environments

#### Deploy to Development
```bash
yarn deploy:dev
```

#### Deploy to Staging
```bash
yarn deploy:staging
```

#### Deploy to Production
```bash
yarn deploy:production
```

### Step 3: Verify Deployment

1. Check The Graph Studio dashboard
2. Monitor indexing progress
3. Test queries once synced

## Updating After Contract Changes

When you redeploy your smart contract, follow these steps to update the subgraph:

### Step 1: Update Contract Information

Edit the appropriate configuration file(s):

**For Development (`subgraph.yaml`):**
```yaml
dataSources:
  - kind: ethereum
    name: EternalMintNfts
    network: autonomys-chronos
    source:
      address: "NEW_CONTRACT_ADDRESS"
      abi: EternalMintNfts
      startBlock: NEW_START_BLOCK
```

**For Staging (`subgraph.staging.yaml`):**
```yaml
dataSources:
  - kind: ethereum
    name: EternalMintNfts
    network: autonomys-chronos
    source:
      address: "NEW_CONTRACT_ADDRESS"
      abi: EternalMintNfts
      startBlock: NEW_START_BLOCK
```

**For Production (`subgraph.production.yaml`):**
```yaml
dataSources:
  - kind: ethereum
    name: EternalMintNfts
    network: autonomys-mainnet
    source:
      address: "NEW_CONTRACT_ADDRESS"
      abi: EternalMintNfts
      startBlock: NEW_START_BLOCK
```

### Step 2: Update Networks Configuration

Edit `networks.json`:
```json
{
  "autonomys-chronos": {
    "EternalMintNfts": {
      "address": "NEW_CONTRACT_ADDRESS",
      "startBlock": NEW_START_BLOCK
    }
  },
  "autonomys-mainnet": {
    "EternalMintNfts": {
      "address": "NEW_CONTRACT_ADDRESS",
      "startBlock": NEW_START_BLOCK
    }
  }
}
```

### Step 3: Update ABI (if contract interface changed)

If you modified the contract interface:

```bash
# From the contracts directory
cd ../contracts
forge build --silent

# Copy updated ABI to subgraph
cat out/EternalMintNfts.sol/EternalMintNfts.json | jq '.abi' > ../subgraph/abis/EternalMintNfts.json

# Return to subgraph directory
cd ../subgraph
```

### Step 4: Regenerate and Deploy

```bash
# Regenerate code with new ABI/config
yarn codegen

# Build with new configuration
yarn build

# Deploy to appropriate environment(s)
yarn deploy:dev
yarn deploy:staging
yarn deploy:production
```

## Manual Deployment Commands

If you prefer manual commands over npm scripts:

```bash
# Development
graph deploy --studio eternalmint-pro-dev

# Staging
graph deploy --studio eternalmint-pro-staging --file subgraph.staging.yaml

# Production
graph deploy --studio eternalmint-pro --file subgraph.production.yaml
```

## Troubleshooting

### Common Issues

#### 1. Network Not Supported
If you see "network not supported" errors:
- Verify Autonomys networks are supported in The Graph Studio
- Contact The Graph team for network addition if needed
- Consider using a hosted service temporarily

#### 2. Start Block Too Early
```
Error: Failed to index: block not found
```
**Solution**: Increase the `startBlock` number in your configuration.

#### 3. Contract Address Mismatch
```
Error: Contract not found at address
```
**Solution**: Verify the contract address and network in your configuration files.

#### 4. ABI Mismatch
```
Error: Event signature mismatch
```
**Solution**: Update the ABI file with the latest contract build:
```bash
cd ../contracts && forge build --silent
cat out/EternalMintNfts.sol/EternalMintNfts.json | jq '.abi' > ../subgraph/abis/EternalMintNfts.json
```

#### 5. Authentication Issues
```
Error: No deploy key provided
```
**Solution**: Re-authenticate with The Graph Studio:
```bash
yarn auth
# Enter your deploy key
```

### Getting Help

- **The Graph Discord**: [discord.gg/graphprotocol](https://discord.gg/graphprotocol)
- **Documentation**: [thegraph.com/docs](https://thegraph.com/docs)
- **Studio Dashboard**: [thegraph.com/studio](https://thegraph.com/studio)

## Quick Reference

### Essential Commands
```bash
# Install dependencies
yarn install

# Authenticate
yarn auth

# Generate code
yarn codegen

# Build subgraph
yarn build

# Deploy to development
yarn deploy:dev

# Deploy to staging
yarn deploy:staging

# Deploy to production
yarn deploy:production
```

### File Structure
```
subgraph/
├── abis/
│   └── EternalMintNfts.json      # Contract ABI
├── src/
│   └── eternalMintNfts.ts        # Event handlers
├── schema.graphql                # GraphQL schema
├── subgraph.yaml                 # Development config
├── subgraph.staging.yaml         # Staging config
├── subgraph.production.yaml      # Production config
├── networks.json                 # Network configurations
└── package.json                  # Dependencies and scripts
```

---

**Current Contract**: `0x2601FB64e5cA137f273Fa64c28056a040d132A1b` (Block: `282110`)