// Static application constants (values that don't change between environments)

// File upload settings are now configured via APP_CONFIG.storage

// Re-export configuration from the centralized app config
export {
  APP_CONFIG, CURRENT_CONTRACT, CURRENT_EVM_NETWORK,
  CURRENT_STORAGE_NETWORK, getImageSizeErrorMessage,
  getImageTypeErrorMessage,
  isDevelopment, isProduction, isStaging, isValidImageSize,
  isValidImageType
} from './app';

import { APP_CONFIG, STORAGE_NETWORKS, type StorageNetworkName } from './app';

// Helper functions for the new network:cid format
export const parseImageString = (imageString: string): { network: string; cid: string } | null => {
  if (!imageString || !imageString.includes(':')) {
    return null;
  }
  
  const [network, cid] = imageString.split(':', 2);
  if (!network || !cid) {
    return null;
  }
  
  return { network, cid };
};

// Construct API URL from network:cid format
export const getStorageApiUrl = (imageString: string): string => {
  const parsed = parseImageString(imageString);
  if (!parsed) {
    return "";
  }
  
  return `/api/cid/${parsed.cid}`;
};

// Construct metadata API URL
export const getMetadataApiUrl = (cid: string): string => {
  return `/api/cid/${cid}`;
};

// Get storage network API URL directly
export const getStorageNetworkApiUrl = (storageNetwork: StorageNetworkName = APP_CONFIG.storage.networkName): string => {
  return STORAGE_NETWORKS[storageNetwork].apiUrl;
};

// Legacy helper for backward compatibility (deprecated - use getStorageApiUrl instead)
export const getStorageUrl = (cid: string) => {
  const storageNetwork = APP_CONFIG.storage.networkName;
  const baseUrl = STORAGE_NETWORKS[storageNetwork].apiUrl;
  return `${baseUrl}/${cid}`;
};

// Legacy exports that are still being used
export const SUPPORTED_IMAGE_TYPES = APP_CONFIG.storage.supportedImageTypes;
export const MINTER_ROLE = APP_CONFIG.contract.roles.minter;
export const DEFAULT_ADMIN_ROLE = APP_CONFIG.contract.roles.admin;
export const BATCH_SIZES = APP_CONFIG.contract.batchSizes; 