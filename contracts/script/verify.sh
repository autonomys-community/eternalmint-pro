#!/bin/bash

# Load environment variables from .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Change the contract address and name if needed
forge verify-contract  \
    --rpc-url $RPC_URL  \
    --verifier blockscout  \
    --verifier-url https://explorer.auto-evm.chronos.autonomys.xyz/api \
    --evm-version london \
    --chain $CHAIN_ID \
    --compiler-version 0.8.30  \
    --watch  \
    --num-of-optimizations 20000 \
    --constructor-args $(cast abi-encode "constructor(string)" "$BASE_URI") \
    $CONTRACT_ADDRESS  \
    src/EternalMintNfts.sol:EternalMintNfts

# If the verification fails, you can try to verify the contract manually using the Single File approach on the Blockscout UI
# forge flatten src/EternalMintNfts.sol > FlattenedEternalMintNfts.sol