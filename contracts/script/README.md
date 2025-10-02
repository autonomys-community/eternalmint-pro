# EternalMint Pro Contract Deployment Guide

This guide covers the complete process of deploying, verifying, and managing the EternalMint Pro smart contracts.

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) installed
- Access to Autonomys Chronos testnet or mainnet
- Private key with sufficient funds for deployment

## 1. Setup and Compilation

### Install Dependencies
```bash
cd contracts
forge install
```

### Compile Contracts
```bash
forge build
```

### Run Tests
```bash
forge test
```

## 2. Contract Deployment

### Environment Setup
```bash
cd contracts/script/
cp .env.sample .env
```

Edit `.env` file with your configuration:
- Set `PRIVATE_KEY`
- Set `RPC_URL` (HTTP/S endpoint)
- Set `BASE_URI` (metadata API endpoint for your environment)
  - Development: `http://localhost:3006/api/cid/`
  - Staging: `https://staging.eternalmint.xyz/api/cid/`
  - Production: `https://eternalmint.xyz/api/cid/`

### Deploy Contract
```bash
bash deploy.sh
```

**Example Output:**
```
##### 8700
✅  [Success] Hash: 0x892e613d6a4268fca80468d0b8fd3cf978a4f22c8264e931b5df2c4c67c5e6fb
Contract Address: 0xCBD609f1CE467e149359475aa2f28daC6B75170d
Block: 280475
Paid: 0.00128263392094095 ETH (3449601 gas * 0.37182095 gwei)

✅ Sequence #1 on 8700 | Total Paid: 0.00128263392094095 ETH (3449601 gas * avg 0.37182095 gwei)
```

**Important:** Update `CONTRACT_ADDRESS` in your `.env` file with the deployed address.

## 3. Contract Verification

Verify the contract on the block explorer:

```bash
bash verify.sh
```

**Example Output:**
```
Start verifying contract `0xCBD609f1CE467e149359475aa2f28daC6B75170d` deployed on 8700
EVM version: london
Compiler version: 0.8.30

Submitting verification for [src/EternalMintNfts.sol:EternalMintNfts] 0xCBD609f1CE467e149359475aa2f28daC6B75170d.
Submitted contract for verification:
        Response: `OK`
        GUID: `cbd609f1ce467e149359475aa2f28dac6b75170d68debe80`
        URL: https://explorer.auto-evm.chronos.autonomys.xyz/address/0xcbd609f1ce467e149359475aa2f28dac6b75170d
Contract verification status:
Response: `OK`
Details: `Pass - Verified`
Contract successfully verified
```

## 4. Role Management

### Check Address Roles

Check if an address has minter or admin roles:

```bash
export CHECK_ADDRESS=0xYourAddressHere
bash check-minter-role.sh
```

**Example - Address without roles:**
```
Checking MINTER_ROLE for address: 0xd84fd13F18da5A615Bda57027042931eF34bbe9B
Contract address: 0xCBD609f1CE467e149359475aa2f28daC6B75170d

Checking MINTER_ROLE...
❌ Address does NOT have MINTER_ROLE

Checking DEFAULT_ADMIN_ROLE...
❌ Address does NOT have DEFAULT_ADMIN_ROLE
```

**Example - Admin address:**
```
Checking MINTER_ROLE for address: 0x720e393Ea409d0F63c52dE27450916F120D7C054
Contract address: 0xCBD609f1CE467e149359475aa2f28daC6B75170d

Checking MINTER_ROLE...
✅ Address HAS MINTER_ROLE

Checking DEFAULT_ADMIN_ROLE...
✅ Address HAS DEFAULT_ADMIN_ROLE (can grant/revoke roles)
```

### Grant Minter Role

Grant minting permissions to an address:

```bash
export NEW_MINTER_ADDRESS=0xAddressToGrantRole
bash grant-minter-role.sh
```

**Example Output:**
```
Granting MINTER_ROLE to: 0xd84fd13F18da5A615Bda57027042931eF34bbe9B
Contract address: 0xCBD609f1CE467e149359475aa2f28daC6B75170d
Calculating MINTER_ROLE hash...
MINTER_ROLE hash: 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
Calling grantRole...

blockHash            0x05de142cbbc30b1ec2d17410e2dcaa56f5284fa5df21afa78bb8bdbdaa0ef36d
blockNumber          280547
contractAddress      
cumulativeGasUsed    64648
effectiveGasPrice    371851043
from                 0x720e393Ea409d0F63c52dE27450916F120D7C054
gasUsed              64648
status               1 (success)
transactionHash      0x96d3ccf610662555080fae2c1ccba2a77b2b73a33aefbf063d582eeb85b4c4ab
Done!
```

**Verify the role was granted:**
```
Checking MINTER_ROLE for address: 0xd84fd13F18da5A615Bda57027042931eF34bbe9B
Contract address: 0xCBD609f1CE467e149359475aa2f28daC6B75170d

Checking MINTER_ROLE...
✅ Address HAS MINTER_ROLE

Checking DEFAULT_ADMIN_ROLE...
❌ Address does NOT have DEFAULT_ADMIN_ROLE
```

### Revoke Minter Role

Remove minting permissions from an address:

```bash
export REVOKE_FROM_ADDRESS=0xAddressToRevokeFrom
bash revoke-minter-role.sh
```

**Example Output:**
```
Revoking MINTER_ROLE from: 0xd84fd13F18da5A615Bda57027042931eF34bbe9B
Contract address: 0xCBD609f1CE467e149359475aa2f28daC6B75170d
Calculating MINTER_ROLE hash...
MINTER_ROLE hash: 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
Calling revokeRole...

blockHash            0x3a133f3f6e0b2b2675d2444dd37499cf58f66206e914ccd8baa3392e2b377f83
blockNumber          280556
status               1 (success)
transactionHash      0xb45d32d04e94aa44a555516ae4f90ac4bc53b248bb107edfe3a1e4cb916c764b
Done!
```

**Verify the role was revoked:**
```
Checking MINTER_ROLE for address: 0xd84fd13F18da5A615Bda57027042931eF34bbe9B
Contract address: 0xCBD609f1CE467e149359475aa2f28daC6B75170d

Checking MINTER_ROLE...
❌ Address does NOT have MINTER_ROLE

Checking DEFAULT_ADMIN_ROLE...
❌ Address does NOT have DEFAULT_ADMIN_ROLE
```

## 5. Base URI Management

The contract supports dynamic base URI configuration for different environments.

### View Current Base URI
```bash
cast call $CONTRACT_ADDRESS "getBaseURI()" --rpc-url $RPC_URL
```

### Update Base URI (Admin Only)
```bash
# Update to staging environment
cast send $CONTRACT_ADDRESS \
  "setBaseURI(string)" \
  "https://staging.eternalmintpro.xyz/api/cid/" \
  --private-key $PRIVATE_KEY \
  --rpc-url $RPC_URL

# Update to production environment  
cast send $CONTRACT_ADDRESS \
  "setBaseURI(string)" \
  "https://eternalmintpro.xyz/api/cid/" \
  --private-key $PRIVATE_KEY \
  --rpc-url $RPC_URL
```

## Role Hierarchy

- **DEFAULT_ADMIN_ROLE**: Can grant and revoke all roles, including MINTER_ROLE, and update base URI
- **MINTER_ROLE**: Can mint new NFTs through the contract

## Network Information

- **Chronos Testnet**: Chain ID 8700
- **Mainnet**: Chain ID 870
