"use client";

import { APP_CONFIG, getGatewayUrl } from "@/config/app";
import { useEffect, useRef, useState } from "react";
import { NFT, NftMinted } from "../types";
import { NftContainer } from "./NftContainer";

export const LatestNFTList: React.FC = () => {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false); // Prevent duplicate fetches

  useEffect(() => {
    const fetchNFTs = async () => {
      // Prevent duplicate fetches (React StrictMode, re-renders, etc.)
      if (fetchingRef.current) {
        console.log('LatestNFTList: Fetch already in progress, skipping...');
        return;
      }
      
      console.log('LatestNFTList: Starting fetch');
      fetchingRef.current = true;
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(APP_CONFIG.contract.subgraphUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query {
              nftMinteds(first: 10, orderBy: blockTimestamp, orderDirection: desc) {
                id
                tokenId
                creator
                supply
                cid
                blockNumber
                blockTimestamp
              }
            }
          `,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Subgraph request failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log("Subgraph response:", result);
      
      // Validate subgraph response structure
      if (!result || !result.data || !Array.isArray(result.data.nftMinteds)) {
        console.warn("Invalid subgraph response structure:", result);
        setNfts([]);
        return;
      }
      
      const { data } = result;
      
      // Process all NFTs in parallel with Promise.allSettled to handle individual failures
      const nftPromises = data.nftMinteds.map(async (item: NftMinted): Promise<NFT> => {
        // Create base NFT object with required fields
        const baseNft: NFT = {
          id: item.id,
          creator: item.creator,
          quantity: item.supply,
          cid: item.cid,
          tokenId: item.tokenId.toString(),
        };
        
        try {
          // Fetch metadata directly from gateway
          const metadataUrl = getGatewayUrl(item.cid);
          const metadataResponse = await fetch(metadataUrl, {
            // Add timeout to prevent hanging requests
            signal: AbortSignal.timeout(10000), // 10 second timeout
          });
          
          if (metadataResponse.ok) {
            const metadata = await metadataResponse.json();
            return {
              ...baseNft,
              image: metadata.image || undefined,
              name: metadata.name || undefined,
              description: metadata.description || undefined,
            };
          } else {
            console.warn(`Failed to fetch metadata for NFT ${item.id}: ${metadataResponse.status}`);
          }
        } catch (error) {
          console.error(`Error fetching metadata for NFT ${item.id}:`, error);
        }
        
        // Return NFT with base data even if metadata fetch failed
        return baseNft;
      });
      
      // Use Promise.allSettled to handle individual failures gracefully
      const nftResults = await Promise.allSettled(nftPromises);
      
      // Extract successful results and log any failures
      const transformedNfts = nftResults
        .map((result, index) => {
          if (result.status === 'fulfilled') {
            return result.value;
          } else {
            console.error(`Failed to process NFT at index ${index}:`, result.reason);
            return null;
          }
        })
        .filter((nft): nft is NFT => nft !== null);
      
      console.log(`Successfully processed ${transformedNfts.length} out of ${data.nftMinteds.length} NFTs`);
      setNfts(transformedNfts);
      } catch (error) {
        console.error('LatestNFTList: Error fetching NFTs:', error);
        setError(error instanceof Error ? error.message : 'Failed to load NFTs');
        setNfts([]); // Clear any existing NFTs on error
      } finally {
        setLoading(false);
        fetchingRef.current = false; // Reset fetch flag
        console.log('LatestNFTList: Fetch completed');
      }
    };

    fetchNFTs();
  }, []);

  return (
    <div className="mt-8 mb-4">
      <h2 className="text-2xl font-bold mb-4">Latest NFTs Created</h2>
      
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2 text-gray-600">Loading NFTs...</span>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading NFTs
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  className="bg-red-100 px-2 py-1 text-sm font-medium text-red-800 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={() => window.location.reload()}
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!loading && !error && nfts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No NFTs found. Be the first to create one!</p>
        </div>
      )}
      
      {!loading && !error && nfts.length > 0 && (
        <ul className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {nfts.map((nft) => (
            <NftContainer key={nft.id} nft={nft} />
          ))}
        </ul>
      )}
    </div>
  );
};
