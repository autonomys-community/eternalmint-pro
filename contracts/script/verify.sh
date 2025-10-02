#!/bin/bash

# Load environment variables from .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Change the contract address and name if needed
forge verify-contract  \
    --rpc-url $RPC_URL  \
    --verifier blockscout  \
    --verifier-url https://explorer.auto-evm.chronos.autonomys.xyz/api -e "" \
    --evm-version london --chain 490000 --compiler-version 0.8.30  \
    --watch  \
    0x346201D2A8eB53807991AF04f7842334674B8793  \
    src/EternalMintNfts.sol:EternalMintNfts

# If the verification fails, you can try to verify the contract manually using the Single File approach on the Blockscout UI
# forge flatten src/EternalMintNfts.sol > FlattenedEternalMintNfts.sol