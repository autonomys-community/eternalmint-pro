import { APP_CONFIG } from '@/config/app';

export interface MetaMaskError extends Error {
  code?: number;
  data?: any;
}

/**
 * Check if MetaMask is installed and available
 */
export const isMetaMaskAvailable = (): boolean => {
  return typeof window !== 'undefined' && !!window.ethereum;
};

/**
 * Get the current chain ID from MetaMask
 */
export const getCurrentChainId = async (): Promise<string> => {
  if (!isMetaMaskAvailable()) {
    throw new Error('MetaMask not available');
  }
  return String(await window.ethereum!.request({ method: 'eth_chainId' }));
};

/**
 * Check if user is on the correct network
 */
export const isOnCorrectNetwork = async (): Promise<boolean> => {
  try {
    const currentChainId = await getCurrentChainId();
    const expectedChainId = `0x${APP_CONFIG.evmNetwork.chainId.toString(16)}`;
    return currentChainId === expectedChainId;
  } catch (error) {
    console.error('Error checking network:', error);
    return false;
  }
};

/**
 * Switch to the correct network or add it if it doesn't exist
 */
export const ensureCorrectNetwork = async (): Promise<boolean> => {
  if (!isMetaMaskAvailable()) {
    throw new Error('MetaMask not available');
  }

  const expectedChainId = `0x${APP_CONFIG.evmNetwork.chainId.toString(16)}`;
  
  try {
    // First try to switch to the network
    await window.ethereum!.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: expectedChainId }],
    });
    return true;
  } catch (switchError: any) {
    // If the network doesn't exist (error code 4902), add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum!.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: expectedChainId,
            chainName: APP_CONFIG.evmNetwork.name,
            nativeCurrency: {
              name: APP_CONFIG.evmNetwork.currency.name,
              symbol: APP_CONFIG.evmNetwork.currency.symbol,
              decimals: APP_CONFIG.evmNetwork.currency.decimals,
            },
            rpcUrls: [APP_CONFIG.evmNetwork.rpcUrl],
            blockExplorerUrls: [APP_CONFIG.evmNetwork.blockExplorer],
          }],
        });
        return true;
      } catch (addError) {
        console.error('Error adding network to MetaMask:', addError);
        throw new Error('Failed to add network to MetaMask. Please add it manually.');
      }
    } else {
      console.error('Error switching network:', switchError);
      throw new Error('Failed to switch network. Please switch manually in MetaMask.');
    }
  }
};

/**
 * Add an ERC1155 NFT to MetaMask wallet
 */
export const addNFTToMetaMask = async (tokenId: string, name?: string, image?: string): Promise<boolean> => {
  if (!isMetaMaskAvailable()) {
    throw new Error('MetaMask not available');
  }

  // Ensure we're on the correct network first
  await ensureCorrectNetwork();

  try {
    const wasAdded = await window.ethereum!.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC1155',
        options: {
          address: APP_CONFIG.contract.address,
          tokenId: tokenId,
          symbol: name || `NFT #${tokenId}`,
          image: image || '',
        },
      },
    });

    return Boolean(wasAdded);
  } catch (error: any) {
    console.error('Error adding NFT to MetaMask:', error);
    
    // Provide more specific error messages
    if (error.code === 4001) {
      throw new Error('Request was rejected by the user.');
    } else if (error.message?.includes('ownership')) {
      throw new Error('Unable to verify NFT ownership. This may be due to network issues or the NFT standard not being fully supported by MetaMask.');
    } else {
      throw new Error('Failed to add NFT to MetaMask. Please ensure you own this NFT and try again.');
    }
  }
};

/**
 * Get a user-friendly error message for MetaMask errors
 */
export const getMetaMaskErrorMessage = (error: MetaMaskError): string => {
  if (error.code === 4001) {
    return 'Request was rejected by the user.';
  } else if (error.code === 4902) {
    return 'The requested network is not available in MetaMask.';
  } else if (error.message?.includes('ownership')) {
    return 'Unable to verify NFT ownership. This may be due to network issues.';
  } else if (error.message?.includes('network')) {
    return 'Network error. Please check your connection and try again.';
  } else {
    return error.message || 'An unknown error occurred.';
  }
};
