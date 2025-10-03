"use client";

import { getMetadataApiUrl, getStorageApiUrl } from "@/config/constants";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { NFT } from "../types";
import { NFTCard } from "./NFTCard";

interface OwnedNFT {
  id: string;
  tokenId: string;
  balance: number;
  cid: string;
  image: string;
  name: string;
  description: string;
  quantity: number;
}

export const MyNFTsList: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [ownedNFTs, setOwnedNFTs] = useState<OwnedNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false); // Prevent duplicate fetches

  const fetchOwnedNFTs = useCallback(async () => {
    if (!address || !isConnected) return;
    
    // Prevent duplicate fetches (React StrictMode, re-renders, etc.)
    if (fetchingRef.current) {
      console.log('MyNFTsList: Fetch already in progress, skipping...');
      return;
    }
    
    console.log('MyNFTsList: Starting fetch for address:', address);
    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // First, get user's owned tokens from the contract
      const tokensResponse = await fetch("/api/utils/contract-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "getUserTokens",
          args: [address]
        })
      });

      if (!tokensResponse.ok) {
        throw new Error("Failed to fetch user tokens");
      }

      const tokensData = await tokensResponse.json();
      const [tokenIds, balances] = tokensData.result;

      if (!tokenIds || tokenIds.length === 0) {
        setOwnedNFTs([]);
        setLoading(false);
        return;
      }

      // Fetch details for each owned token
      const nfts: OwnedNFT[] = [];

      // Process all tokens in parallel instead of sequentially
      const nftPromises = tokenIds.map(async (tokenIdBigInt, i) => {
        try {
          const tokenId = tokenIdBigInt.toString();
          const balance = parseInt(balances[i].toString());

          // Fetch CID
          const cidResponse = await fetch("/api/utils/contract-call", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              method: "getCid",
              args: [tokenId]
            })
          });

          if (!cidResponse.ok) return null;

          const cidData = await cidResponse.json();

          const cid = cidData.result;

          // Fetch metadata
          let imageUrl = "";
          let name = "";
          let description = "";

          try {
            const metadataApiUrl = getMetadataApiUrl(cid);
            const metadataResponse = await fetch(metadataApiUrl);
            if (metadataResponse.ok) {
              const metadata = await metadataResponse.json();
              imageUrl = metadata.image ? getStorageApiUrl(metadata.image) : "";
              name = metadata.name || `NFT ${tokenId}`;
              description = metadata.description || "";
            }
          } catch (error) {
            console.error(`Error fetching metadata for token ${tokenId}:`, error);
            name = `NFT ${tokenId}`;
          }

          return {
            id: `${address}-${tokenId}`,
            tokenId: tokenId,
            balance,
            cid,
            image: imageUrl,
            name,
            description,
            quantity: balance
          };

        } catch (error) {
          console.error(`Error processing token ${tokenIdBigInt}:`, error);
          return null;
        }
      });

      // Wait for all NFTs to be processed and filter out nulls
      const processedNfts = await Promise.all(nftPromises);
      const validNfts = processedNfts.filter((nft): nft is OwnedNFT => nft !== null);
      
      nfts.push(...validNfts);

      setOwnedNFTs(nfts);
    } catch (error) {
      console.error("Error fetching owned NFTs:", error);
      setError("Failed to load your NFTs. Please try again.");
    } finally {
      setLoading(false);
      fetchingRef.current = false; // Reset fetch flag
      console.log('MyNFTsList: Fetch completed');
    }
  }, [address, isConnected]);

  // Function to update specific NFT quantity
  const updateNFTQuantity = useCallback((tokenId: string, newQuantity: number) => {
    setOwnedNFTs(prev => {
      // Always update the NFT quantity, even if it's 0
      return prev.map(nft => 
        nft.tokenId === tokenId 
          ? { ...nft, quantity: newQuantity, balance: newQuantity }
          : nft
      );
    });
  }, []);

  useEffect(() => {
    fetchOwnedNFTs();
  }, [fetchOwnedNFTs]);

  if (!isConnected) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-6">🔐</div>
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Unlock Your Collection
          </h2>
          <p className="text-gray-300 mb-8 leading-relaxed">
            Connect your wallet to access your trading card collection and see all your eternal NFTs
          </p>
          <button
            onClick={openConnectModal}
            className="px-8 py-4 bg-gradient-to-r from-[#1E58FC] via-[#D914E4] to-[#F10419] text-white rounded-xl font-semibold hover:opacity-90 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            🔗 Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/20 border-t-purple-500 mx-auto mb-6"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-2xl animate-pulse">🎴</div>
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Loading Your Collection...
        </h2>
        <p className="text-gray-300">
          Shuffling through your trading cards
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-6">😵</div>
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-8 backdrop-blur-md">
            <h2 className="text-2xl font-bold mb-3 text-red-200">Oops! Cards Scattered</h2>
            <p className="text-red-300 mb-6 leading-relaxed">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 hover:scale-105 shadow-lg font-medium"
            >
              🔄 Gather Cards Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (ownedNFTs.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-6">🎴</div>
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Start Your Collection
          </h2>
          <p className="text-gray-300 mb-8 leading-relaxed">
            You don&apos;t have any trading cards yet. Create your first eternal NFT card and start building your unique collection!
          </p>
          <div className="space-y-4">
            <a
              href="/create"
              className="inline-block px-8 py-4 bg-gradient-to-r from-[#1E58FC] via-[#D914E4] to-[#F10419] text-white rounded-xl font-semibold hover:opacity-90 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              🎨 Create Your First Card
            </a>
            <div className="text-sm text-gray-400">
              or browse existing NFTs to trade
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">{ownedNFTs.length}</span>
          </div>
          <h2 className="text-2xl font-bold">
            Your Trading Cards
          </h2>
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span>{ownedNFTs.length} unique cards</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            <span>{ownedNFTs.filter(nft => nft.balance > 0).reduce((total, nft) => total + nft.balance, 0)} total copies</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
            <span>Premium collection</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-2 items-stretch auto-rows-fr">
        {ownedNFTs.map((nft, index) => (
          <NFTCard 
            key={nft.id} 
            nft={{
              id: nft.id,
              image: nft.image,
              name: nft.name,
              description: nft.description,
              creator: '', // Not needed for this view
              quantity: nft.quantity,
              cid: nft.cid,
              tokenId: nft.tokenId
            } as NFT}
            onQuantityUpdate={updateNFTQuantity}
            priority={index < 2} // Priority for first 2 NFTs (above the fold)
          />
        ))}
      </div>
    </div>
  );
}; 