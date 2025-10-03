"use client";

import { APP_CONFIG, getGatewayUrl } from "@/config/app";
import { useEffect, useRef, useState } from "react";
import { NFT, NftMinted } from "../types";
import { NftContainer } from "./NftContainer";

export const LatestNFTList: React.FC = () => {
  const [nfts, setNfts] = useState<NFT[]>([]);
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
      const { data } = await response.json();
      console.log("data", data);
      
      // Process all NFTs in parallel instead of sequentially
      const nftPromises = data.nftMinteds.map(async (item: NftMinted) => {
        let imageUrl = "";
        let name = "";
        let description = "";
        
        try {
          // Fetch metadata directly from gateway
          const metadataUrl = getGatewayUrl(item.cid);
          const metadataResponse = await fetch(metadataUrl);
          if (metadataResponse.ok) {
            const metadata = await metadataResponse.json();
            imageUrl = metadata.image || "";
            name = metadata.name || "";
            description = metadata.description || "";
          }
        } catch (error) {
          console.error(`Error fetching metadata for NFT ${item.id}:`, error);
        }
        
        return {
          id: item.id,
          image: imageUrl,
          name,
          description,
          creator: item.creator,
          quantity: item.supply,
          cid: item.cid,
        };
      });
      
        // Wait for all NFTs to be processed
        const transformedNfts = await Promise.all(nftPromises);
        setNfts(transformedNfts);
      } finally {
        fetchingRef.current = false; // Reset fetch flag
        console.log('LatestNFTList: Fetch completed');
      }
    };

    fetchNFTs();
  }, []);

  return (
    <div className="mt-8 mb-4">
      <h2 className="text-2xl font-bold mb-4">Latest NFTs Created</h2>
      <ul className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {nfts.map((nft) => (
          <NftContainer key={nft.id} nft={nft} />
        ))}
      </ul>
    </div>
  );
};
