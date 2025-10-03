# EternalMint Pro Subgraph

This subgraph indexes EternalMint Pro NFT contract events on the Autonomys Network for efficient querying via GraphQL.

## 🏗️ **Architecture**

- **Development/Staging**: Autonomys Chronos testnet → `eternalmint-pro-staging` studio  
- **Production**: Autonomys mainnet → `eternalmint-pro` studio

## 🔧 **Initial Setup (One-Time)**

### **1. Create Subgraphs in The Graph Studio**

Before using the deployment scripts, you must create the subgraphs in [The Graph Studio](https://thegraph.com/studio/):

1. **Go to**: https://thegraph.com/studio/
2. **Click**: "Create a Subgraph" 
3. **Create**: `eternalmint-pro-staging` (for dev/staging)
4. **Create**: `eternalmint-pro` (for production)
5. **Copy**: Deploy keys from each subgraph page

### **2. Install Dependencies**

```bash
cd subgraph
yarn install
```

### **3. Authenticate CLI**

```bash
graph auth
# When prompted, paste your deploy key from The Graph Studio
# Get deploy key from: https://thegraph.com/studio/subgraph/[your-subgraph]/
```

### **4. Verify Setup**

```bash
yarn validate  # Check configuration files
yarn status    # View current setup
```

## 🚀 **Quick Deployment**

```bash
cd subgraph

# 1. Build subgraph (automated: codegen + build)
yarn deploy:dev      # Builds for staging config
yarn deploy:staging  # Builds for staging config
yarn deploy:production # Builds for production config

# 2. Deploy manually (gives you control)
graph auth           # Authenticate (one-time)
graph deploy eternalmint-pro-staging subgraph.staging.yaml  # Deploy to staging
# or
graph deploy eternalmint-pro subgraph.production.yaml      # Deploy to production

# Deploy with new contract (auto-updates config + builds)
node deploy.js staging 0x1234... 123456  # Then run graph deploy manually
```

## 📋 **Complete Workflow: New Contract Deployment**

When deploying a new EternalMint contract instance:

### **1. Deploy Contract**
Deploy your contract using your preferred method and note the deployment details.

### **2. Get Deployment Info**
```bash
# Note the contract address and block number from deployment output
CONTRACT_ADDRESS=0x1234...
START_BLOCK=123456
```

### **3. Deploy Subgraph**
```bash
cd subgraph
node deploy.js staging $CONTRACT_ADDRESS $START_BLOCK
```

### **4. Update Frontend Config**
Update `web/src/config/app.ts` with new contract address and subgraph URL.

## 🔧 **Manual Configuration**

### **Environment Files**
- `subgraph.staging.yaml` - Development/Staging (Chronos testnet)
- `subgraph.production.yaml` - Production (Mainnet)

### **Update Contract Address**
```bash
# Edit the appropriate .yaml file
vim subgraph.staging.yaml

# Update these fields:
source:
  address: "0xYourNewContractAddress"
  startBlock: 123456
```

### **Update networks.json**
```json
{
  "autonomys-chronos": {
    "EternalMintNfts": {
      "address": "0xYourNewContractAddress", 
      "startBlock": 123456
    }
  },
  "autonomys-mainnet": {
    "EternalMintNfts": {
      "address": "0xYourNewContractAddress",
      "startBlock": 123456  
    }
  }
}
```

## 🛠️ **Development Commands**

```bash
# Install dependencies
yarn install

# Generate code from schema
yarn codegen

# Build subgraph
yarn build

# Run tests
yarn test

# Authenticate with The Graph Studio (one-time setup)
yarn auth
```

## 📊 **The Graph Studio URLs**

- **Development/Staging**: https://thegraph.com/studio/subgraph/eternalmint-pro-staging/
- **Production**: https://thegraph.com/studio/subgraph/eternalmint-pro/

## 🔍 **Troubleshooting**

### **Deployment Fails**

**"Subgraph not found" error:**
```bash
# Make sure subgraph exists in The Graph Studio first
# Visit: https://thegraph.com/studio/
# Create: eternalmint-pro-staging and eternalmint-pro
```

**Authentication issues:**
```bash
# Re-authenticate with fresh deploy key
graph auth
# Get deploy key from: https://thegraph.com/studio/subgraph/[your-subgraph]/
```

**Contract verification:**
```bash
# Verify contract address and start block
cast call $CONTRACT_ADDRESS "name()" --rpc-url $RPC_URL

# Check if start block exists
cast block $START_BLOCK --rpc-url $RPC_URL
```

### **Subgraph Not Syncing**
- Verify contract address is correct
- Ensure start block is not too early (before contract deployment)
- Check The Graph Studio for indexing errors
- Verify network name matches Autonomys network identifiers

### **Schema Changes**
```bash
# After modifying schema.graphql
yarn codegen
yarn build
yarn deploy:staging  # Test first
```

## 📝 **Notes**

- Always deploy to staging before production
- Start block should be the block where the contract was deployed
- Contract address must match exactly (case-sensitive)
- Network names: `autonomys-chronos` (testnet), `autonomys-mainnet` (mainnet)
- The deployment script automatically updates both `networks.json` and `.yaml` files

## 🔗 **Integration**

The subgraph provides GraphQL endpoints used by the frontend:

```typescript
// web/src/config/app.ts
CONTRACT_DEPLOYMENTS = {
  staging: {
    subgraphUrl: 'https://api.studio.thegraph.com/query/114204/eternalmint-pro-staging/v0.0.1'
  }
}
```

Update the subgraph URL in the frontend config after each deployment to match the new version.