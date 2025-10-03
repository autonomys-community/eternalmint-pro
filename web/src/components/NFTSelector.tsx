"use client";

import { APP_CONFIG } from "@/config/app";
import { getMetadataApiUrl, getStorageApiUrl } from "@/config/constants";
import { useHasMinterRole } from "@/hooks/useHasMinterRole";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";

interface NFT {
  tokenId: string;
  cid: string;
  supply: number;
  balance: number;
  creator: string;
  canDistribute: boolean;
  imageUrl?: string;
  name?: string;
  description?: string;
}

interface SelectedNFT {
  tokenId: string;
  cid: string;
  supply: number;
  balance: number;
  amountToDistribute: number;
  imageUrl?: string;
}

interface NFTSelectorProps {
  onNFTSelected: (nft: SelectedNFT) => void;
  distributionMode: 'single-nft' | 'custom';
  onDistributionModeChange: (mode: 'single-nft' | 'custom') => void;
}

const ERC1155_ABI = [
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserTokens",
    outputs: [
      { name: "ownedTokenIds", type: "uint256[]" },
      { name: "ownedBalances", type: "uint256[]" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "getCid",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "getSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "getCreator",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "user", type: "address" },
      { name: "tokenId", type: "uint256" }
    ],
    name: "canUserDistribute",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

export default function NFTSelector({ onNFTSelected, distributionMode, onDistributionModeChange }: NFTSelectorProps) {
  const { address } = useAccount();
  const { hasAdminRole } = useHasMinterRole();
  const [userNFTs, setUserNFTs] = useState<NFT[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [amountToDistribute, setAmountToDistribute] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  // Get user's owned NFTs
  const { data: userTokensData, isLoading: tokensLoading } = useReadContract({
    address: APP_CONFIG.contract.address as `0x${string}`,
    abi: ERC1155_ABI,
    functionName: "getUserTokens",
    args: [address!],
    query: {
      enabled: !!address,
    },
  });

  // Fetch NFT metadata for each owned token
  useEffect(() => {
    const fetchNFTData = async () => {
      if (!userTokensData || tokensLoading) return;
      
      setLoading(true);
      const [tokenIds, balances] = userTokensData;
      const nfts: NFT[] = [];

      for (let i = 0; i < tokenIds.length; i++) {
        try {
          // Get CID
          const cidResponse = await fetch(`/api/utils/contract-call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              method: 'getCid',
              args: [tokenIds[i].toString()]
            })
          });
          const cidData = await cidResponse.json();

          // Get supply
          const supplyResponse = await fetch(`/api/utils/contract-call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              method: 'getSupply',
              args: [tokenIds[i].toString()]
            })
          });
          const supplyData = await supplyResponse.json();

          // Get creator
          const creatorResponse = await fetch(`/api/utils/contract-call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              method: 'getCreator',
              args: [tokenIds[i].toString()]
            })
          });
          const creatorData = await creatorResponse.json();

          // Check if user can distribute this NFT
          const canDistributeResponse = await fetch(`/api/utils/contract-call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              method: 'canUserDistribute',
              args: [address, tokenIds[i].toString()]
            })
          });
          const canDistributeData = await canDistributeResponse.json();

          // Fetch metadata to get image URL
          let imageUrl = '';
          let name = '';
          let description = '';
          try {
            // For metadata CIDs from contract, construct URL directly using current storage network
            const metadataApiUrl = getMetadataApiUrl(cidData.result);
            const metadataResponse = await fetch(metadataApiUrl);
            if (metadataResponse.ok) {
              const metadata = await metadataResponse.json();
              imageUrl = metadata.image ? getStorageApiUrl(metadata.image) : "";
              name = metadata.name || '';
              description = metadata.description || '';
            }
          } catch (error) {
            console.error(`Error fetching metadata for token ${tokenIds[i]}:`, error);
          }

          const nft: NFT = {
            tokenId: tokenIds[i].toString(),
            cid: cidData.result,
            supply: parseInt(supplyData.result),
            balance: parseInt(balances[i].toString()),
            creator: creatorData.result,
            canDistribute: canDistributeData.result === "true",
            imageUrl,
            name,
            description
          };

          // Only include NFTs the user can distribute
          if (nft.canDistribute) {
            nfts.push(nft);
          }
        } catch (error) {
          console.error(`Error fetching data for token ${tokenIds[i]}:`, error);
        }
      }

      setUserNFTs(nfts);
      setLoading(false);
    };

    fetchNFTData();
  }, [userTokensData, tokensLoading, address]);

  const handleNFTSelect = (nft: NFT) => {
    setSelectedNFT(nft);
    setAmountToDistribute(1);
  };

  const handleConfirmSelection = () => {
    if (!selectedNFT) return;

    onNFTSelected({
      tokenId: selectedNFT.tokenId,
      cid: selectedNFT.cid,
      supply: selectedNFT.supply,
      balance: selectedNFT.balance,
      amountToDistribute,
      imageUrl: selectedNFT.imageUrl
    });
  };

  if (loading || tokensLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-white">Loading your distributable NFTs...</p>
      </div>
    );
  }

  if (userNFTs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎨</div>
        <h3 className="text-xl font-semibold text-white mb-2">No Distributable NFTs Found</h3>
        <p className="text-gray-300 mb-4">
          {hasAdminRole 
            ? "You don't have any NFTs to distribute. Create some NFTs first!"
            : "You don't have any NFTs you can distribute. You can only distribute NFTs you created."
          }
        </p>
        <a
          href="/create"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Create NFTs
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* Distribution Mode Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Distribution Mode</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => onDistributionModeChange('single-nft')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              distributionMode === 'single-nft'
                ? 'border-blue-500 bg-blue-500/20 text-white'
                : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
            }`}
          >
            <div className="text-2xl mb-2">📤</div>
            <h4 className="font-semibold mb-1">Single NFT Distribution</h4>
            <p className="text-sm opacity-80">
              Send the same NFT to multiple recipients
            </p>
          </button>
          
          <button
            onClick={() => onDistributionModeChange('custom')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              distributionMode === 'custom'
                ? 'border-blue-500 bg-blue-500/20 text-white'
                : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
            }`}
          >
            <div className="text-2xl mb-2">🎯</div>
            <h4 className="font-semibold mb-1">Custom Distribution</h4>
            <p className="text-sm opacity-80">
              Send different NFTs to different recipients
            </p>
          </button>
        </div>
      </div>

      {/* NFT Selection */}
      <h3 className="text-lg font-semibold text-white mb-4">
        Select NFT to Distribute ({userNFTs.length} available)
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {userNFTs.map((nft) => (
          <div
            key={nft.tokenId}
            onClick={() => handleNFTSelect(nft)}
            className={`cursor-pointer rounded-lg border-2 transition-all duration-200 ${
              selectedNFT?.tokenId === nft.tokenId
                ? 'border-blue-500 bg-blue-500/20 scale-105'
                : 'border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:scale-102'
            }`}
          >
            <div className="p-4">
              {/* NFT Image */}
              <div className="aspect-square bg-gray-700 rounded-lg mb-3 overflow-hidden">
                <Image
                  src={nft.imageUrl || '/images/image-example.png'}
                  alt="NFT"
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/images/image-example.png';
                  }}
                />
              </div>
              
              {/* NFT Info */}
              <div className="text-white">
                {nft.name && (
                  <p className="font-semibold mb-1">{nft.name}</p>
                )}
                {nft.description && (
                  <p className="text-sm text-gray-300 mb-2 line-clamp-2">{nft.description}</p>
                )}
                <p className="text-xs text-gray-400 mb-1">Token ID: {nft.tokenId.slice(0, 8)}...</p>
                <p className="text-sm text-gray-300 mb-1">Total Supply: {nft.supply}</p>
                <p className="text-sm text-gray-300 mb-1">Your Balance: {nft.balance}</p>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">Creator:</span>
                  <span className="text-xs text-gray-300 font-mono">
                    {nft.creator === address ? "You" : `${nft.creator.slice(0, 6)}...${nft.creator.slice(-4)}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Amount Selection (for single NFT mode) */}
      {selectedNFT && distributionMode === 'single-nft' && (
        <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
          <h4 className="text-lg font-semibold text-white mb-4">Distribution Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount per recipient
              </label>
              <input
                type="number"
                min="1"
                max={selectedNFT.balance}
                value={amountToDistribute}
                onChange={(e) => setAmountToDistribute(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">
                Maximum: {selectedNFT.balance} (your current balance)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Maximum recipients
              </label>
              <div className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                {Math.floor(selectedNFT.balance / amountToDistribute)}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Based on your balance and amount per recipient
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Selection */}
      {selectedNFT && (
        <div className="text-center">
          <button
            onClick={handleConfirmSelection}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Continue with Selected NFT
          </button>
        </div>
      )}
    </div>
  );
} 