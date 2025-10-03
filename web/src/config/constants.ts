// Static application constants (values that don't change between environments)

// Re-export configuration from the centralized app config
export {
  APP_CONFIG, CURRENT_CONTRACT, CURRENT_EVM_NETWORK,
  CURRENT_STORAGE_NETWORK, getImageSizeErrorMessage,
  getImageTypeErrorMessage,
  isDevelopment, isProduction, isStaging, isValidImageSize,
  isValidImageType
} from './app';

import { APP_CONFIG } from './app';

// Direct exports that are still being used
export const SUPPORTED_IMAGE_TYPES = APP_CONFIG.storage.supportedImageTypes;
export const MINTER_ROLE = APP_CONFIG.contract.roles.minter;
export const DEFAULT_ADMIN_ROLE = APP_CONFIG.contract.roles.admin;
export const BATCH_SIZES = APP_CONFIG.contract.batchSizes;