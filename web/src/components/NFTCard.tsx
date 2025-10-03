"use client";

import { APP_CONFIG, getGatewayUrl } from "@/config/app";
import { useDepth } from "@/contexts/DepthContext";
import { getImageOptimizationSettings, isLikelyAnimatedGif } from "@/utils/mediaUtils";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NFT } from "../types";
import { ImageModal } from "./ImageModal";
import { TransferModal } from "./TransferModal";

interface NFTCardProps {
  nft: NFT;
  onQuantityUpdate?: (tokenId: string, newQuantity: number) => void;
  priority?: boolean; // For above-the-fold images
}

export const NFTCard: React.FC<NFTCardProps> = ({ nft, onQuantityUpdate, priority = false }) => {
  const { depthEnabled } = useDepth();
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalNft, setModalNft] = useState(nft);
  const [imageError, setImageError] = useState(false);
  const [addingToMetaMask, setAddingToMetaMask] = useState(false);

  // Helper function to validate image URL
  const isValidImageUrl = (url: string): boolean => {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Check if the image is animated
  const isAnimated = useMemo(() => {
    if (!nft?.image) return false;
    return isLikelyAnimatedGif(nft.image);
  }, [nft?.image]);

  // Get optimization settings for the image
  const imageSettings = useMemo(() => {
    const settings = getImageOptimizationSettings(isAnimated ? 'image/gif' : undefined);
    // Remove priority from settings since we set it explicitly as a prop
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { priority: _priority, ...settingsWithoutPriority } = settings;
    return settingsWithoutPriority;
  }, [isAnimated]);

  // Handle quantity updates from the modal
  const handleQuantityUpdate = useCallback((tokenId: string, newQuantity: number) => {
    setModalNft(prev => ({
      ...prev,
      quantity: newQuantity
    }));
    onQuantityUpdate?.(tokenId, newQuantity);
  }, [onQuantityUpdate]);

  const handleImageLoad = useCallback(() => {
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleAddToMetaMask = useCallback(async () => {
    if (!nft.tokenId || !window.ethereum) {
      alert('MetaMask not detected. Please install MetaMask to add tokens.');
      return;
    }

    setAddingToMetaMask(true);
    try {
      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC1155',
          options: {
            address: APP_CONFIG.contract.address,
            tokenId: nft.tokenId,
            symbol: nft.name || `NFT #${nft.tokenId}`,
            image: nft.image,
          },
        },
      });
      
      if (wasAdded) {
        // Brief success feedback
        setTimeout(() => setAddingToMetaMask(false), 1000);
      } else {
        setAddingToMetaMask(false);
      }
    } catch (error) {
      console.error('Error adding token to MetaMask:', error);
      setAddingToMetaMask(false);
      alert('Failed to add token to MetaMask. Please try again.');
    }
  }, [nft.tokenId, nft.name, nft.image]);

  const getExplorerUrl = useCallback(() => {
    if (!nft.tokenId) return '#';
    return `${APP_CONFIG.evmNetwork.blockExplorer}/token/${APP_CONFIG.contract.address}/instance/${nft.tokenId}`;
  }, [nft.tokenId]);

  // Update modal NFT when the original NFT changes
  useEffect(() => {
    if (!isTransferModalOpen && nft) {
      setModalNft(nft);
    }
  }, [nft, isTransferModalOpen]);

  // Early return if nft is not properly loaded (after all hooks)
  if (!nft || !nft.id) {
    return null;
  }

  // Depth effect class configurations
  const stackedCardClasses = depthEnabled 
    ? "absolute inset-0 bg-gradient-to-br from-white/5 to-white/2 rounded-xl border border-white/10 transform rotate-1 translate-x-2 translate-y-2 shadow-[0_6px_24px_rgba(0,0,0,0.3),0_3px_12px_rgba(0,0,0,0.2)] z-0 group-hover:rotate-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-all duration-500"
    : "absolute inset-0 bg-gradient-to-br from-white/5 to-white/2 rounded-xl border border-white/10 transform rotate-1 translate-x-1 translate-y-1 shadow-lg z-0";
  
  const stackedCard2Classes = depthEnabled
    ? "absolute inset-0 bg-gradient-to-br from-white/8 to-white/3 rounded-xl border border-white/15 transform -rotate-1 translate-x-1 translate-y-1 shadow-[0_4px_16px_rgba(0,0,0,0.25),0_2px_8px_rgba(0,0,0,0.15)] z-0 group-hover:-rotate-2 group-hover:translate-x-1.5 group-hover:translate-y-1.5 transition-all duration-500"
    : "absolute inset-0 bg-gradient-to-br from-white/8 to-white/3 rounded-xl border border-white/15 transform -rotate-1 translate-x-0.5 translate-y-0.5 shadow-lg z-0";
  
  const mainCardClasses = depthEnabled
    ? "relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_4px_16px_rgba(0,0,0,0.3),0_2px_8px_rgba(0,0,0,0.2)] hover:shadow-[0_16px_64px_rgba(0,0,0,0.5),0_8px_32px_rgba(0,0,0,0.4),0_4px_16px_rgba(0,0,0,0.3)] hover:scale-105 hover:-translate-y-2 transition-all duration-500 ease-out overflow-hidden z-20 flex-1 flex flex-col transform-gpu perspective-1000"
    : "relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-xl border border-white/20 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 ease-out overflow-hidden z-20 flex-1 flex flex-col";
  
  const imageContainerClasses = depthEnabled
    ? "relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-800/50 mb-6 shadow-[inset_0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_4px_rgba(0,0,0,0.2)] border border-black/20"
    : "relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-800/50 mb-6";
  
  const buttonClasses = depthEnabled
    ? nft.quantity === 0
      ? "w-full py-3 px-6 rounded-lg font-semibold text-base transition-all duration-200 bg-gray-700 text-gray-400 cursor-not-allowed shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
      : "w-full py-3 px-6 rounded-lg font-semibold text-base transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-[0_4px_16px_rgba(59,130,246,0.3),0_2px_8px_rgba(147,51,234,0.2)] hover:shadow-[0_6px_24px_rgba(59,130,246,0.4),0_3px_12px_rgba(147,51,234,0.3)] transform hover:-translate-y-1 active:translate-y-0 active:shadow-[0_2px_8px_rgba(59,130,246,0.3)] border border-white/10"
    : nft.quantity === 0
      ? "w-full py-3 px-6 rounded-lg font-semibold text-base transition-all duration-200 bg-gray-700 text-gray-400 cursor-not-allowed"
      : "w-full py-3 px-6 rounded-lg font-semibold text-base transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5";

  return (
    <>
      <div className="group relative h-full flex flex-col min-h-[500px]">
        {/* Stacked Cards Effect for Multiple Copies */}
        {nft.quantity > 1 && (
          <>
            {/* Back Card */}
            <div className={stackedCardClasses}>
              {/* Thickness for back card */}
              {depthEnabled && (
                <>
                  <div className="absolute top-0.5 -right-0.5 bottom-0.5 w-0.5 bg-gradient-to-r from-white/6 to-white/2 rounded-r-xl transform skew-y-0.5 shadow-[0.5px_0_2px_rgba(0,0,0,0.15)] pointer-events-none group-hover:w-1 transition-all duration-500"></div>
                  <div className="absolute -bottom-0.5 left-0.5 right-0.5 h-0.5 bg-gradient-to-b from-white/6 to-white/2 rounded-b-xl transform skew-x-0.5 shadow-[0_0.5px_2px_rgba(0,0,0,0.15)] pointer-events-none group-hover:h-1 transition-all duration-500"></div>
                </>
              )}
            </div>
            
            {/* Middle Card */}
            <div className={stackedCard2Classes}>
                             {/* Thickness for middle card */}
               {depthEnabled && (
                 <>
                   <div className="absolute top-0.5 -right-0.5 bottom-0.5 w-0.5 bg-gradient-to-r from-white/8 to-white/3 rounded-r-xl transform skew-y-0.5 shadow-[0.5px_0_3px_rgba(0,0,0,0.2)] pointer-events-none group-hover:w-1 transition-all duration-500"></div>
                   <div className="absolute -bottom-0.5 left-0.5 right-0.5 h-0.5 bg-gradient-to-b from-white/8 to-white/3 rounded-b-xl transform skew-x-0.5 shadow-[0_0.5px_3px_rgba(0,0,0,0.2)] pointer-events-none group-hover:h-1 transition-all duration-500"></div>
                 </>
               )}
            </div>
          </>
        )}
        
        {/* Main Card */}
        <div className={mainCardClasses}>
          {/* Card Border Glow Effect */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
          
          {/* Inner Shadow for Depth */}
          {depthEnabled && (
            <div className="absolute inset-0 rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.1)] pointer-events-none"></div>
          )}

          {/* Card Thickness Effect - Side Edges */}
          {depthEnabled && (
            <>
              {/* Right Edge */}
              <div className="absolute top-0.5 -right-0.5 bottom-0.5 w-1 bg-gradient-to-r from-white/12 to-white/4 rounded-r-xl transform skew-y-0.5 shadow-[1px_0_4px_rgba(0,0,0,0.25)] pointer-events-none group-hover:w-1.5 group-hover:-right-1 transition-all duration-500"></div>
              
              {/* Bottom Edge */}
              <div className="absolute -bottom-0.5 left-0.5 right-0.5 h-1 bg-gradient-to-b from-white/12 to-white/4 rounded-b-xl transform skew-x-0.5 shadow-[0_1px_4px_rgba(0,0,0,0.25)] pointer-events-none group-hover:h-1.5 group-hover:-bottom-1 transition-all duration-500"></div>
              
              {/* Corner Bevel */}
              <div className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-gradient-to-br from-white/15 to-white/6 transform skew-x-0.5 skew-y-0.5 shadow-[1px_1px_3px_rgba(0,0,0,0.3)] pointer-events-none group-hover:w-1.5 group-hover:h-1.5 group-hover:-bottom-1 group-hover:-right-1 transition-all duration-500"></div>
            </>
          )}
        
        {/* Card Content */}
        <div className="relative p-6 flex flex-col flex-1">
          {/* Image Section */}
          <div className={imageContainerClasses}>
            {imageError || !nft.image || !isValidImageUrl(nft.image) ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-4xl mb-2">🖼️</div>
                  <div className="text-sm">No Image</div>
                </div>
              </div>
            ) : (
              <>
                <Image
                  src={nft.image}
                  alt={nft.name || "NFT"}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority={priority}
                  className="object-cover hover:scale-110 transition-transform duration-300 cursor-pointer"
                  {...imageSettings}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  onClick={() => setIsImageModalOpen(true)}
                />
                
                {/* Animated GIF Badge */}
                {isAnimated && (
                  <div className="absolute top-3 right-3 bg-black/80 text-white text-sm px-3 py-1 rounded-full font-medium">
                    GIF
                  </div>
                )}
                
                {/* Quantity Badge */}
                <div className={`absolute top-3 left-3 text-white text-base px-3 py-1 rounded-full font-bold shadow-lg ${
                  nft.quantity > 1 
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 ring-2 ring-yellow-300/50' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-500'
                }`}>
                  {nft.quantity > 1 ? `${nft.quantity}×` : nft.quantity}
                </div>
              </>
            )}
          </div>

          {/* Card Info Section */}
          <div className="flex-1 flex flex-col">
            {/* Title */}
            <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-blue-300 transition-colors">
              {nft.name || `NFT #${nft.tokenId}`}
            </h3>

            {/* Description */}
            {nft.description && (
              <p className="text-base text-gray-300 mb-4 line-clamp-3 flex-1 leading-relaxed">
                {nft.description}
              </p>
            )}

            {/* Card Details */}
            <div className="space-y-3 mb-6">
              {/* Links */}
              <div className="flex flex-col gap-2">
                <Link
                  href={getGatewayUrl(nft.cid)}
                  target="_blank"
                  className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors group"
                >
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                  <span className="hover:underline">View Metadata</span>
                </Link>
                
              </div>
              
              {nft.quantity === 0 && (
                <div className="text-center py-3">
                  <span className="text-red-400 text-base font-medium">No tokens available</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setIsTransferModalOpen(true)}
                disabled={nft.quantity === 0}
                className={buttonClasses}
              >
                {nft.quantity === 0 ? "No Tokens Available" : "Transfer Card"}
              </button>
              
              <button
                onClick={handleAddToMetaMask}
                disabled={addingToMetaMask}
                className="w-full px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 hover:scale-105 shadow-lg font-medium flex items-center justify-center gap-2"
              >
                {addingToMetaMask ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    Add to MetaMask
                  </>
                )}
              </button>
              
              <Link
                href={getExplorerUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 hover:scale-105 shadow-lg font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
                View on Explorer
              </Link>
            </div>
          </div>
        </div>

          {/* Holographic Effect */}
          {depthEnabled && (
            <>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-white/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none transform group-hover:rotate-3 group-hover:scale-105"></div>
              
              {/* Light Reflection Effect */}
              <div className="absolute top-0 left-0 w-full h-full rounded-xl bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none"></div>
            </>
          )}
        </div>
      </div>

      {/* Transfer Modal */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        nft={{
          id: modalNft.id,
          tokenId: modalNft.tokenId || "0",
          name: modalNft.name || `NFT ${modalNft.id}`,
          quantity: modalNft.quantity,
          cid: modalNft.cid,
          image: modalNft.image || ""
        }}
        onQuantityUpdate={handleQuantityUpdate}
      />

      {/* Image Modal */}
      {nft.image && (
        <ImageModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          imageSrc={nft.image}
          imageAlt={nft.name || "NFT"}
          title={nft.name}
          mimeType={isAnimated ? 'image/gif' : undefined}
        />
      )}
    </>
  );
}; 