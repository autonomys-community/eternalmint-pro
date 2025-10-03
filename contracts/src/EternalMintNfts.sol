// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract EternalMintNfts is ERC1155(""), AccessControl, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // Static gateway URL for Auto Drive
    string private constant GATEWAY_URL = "https://gateway.autonomys.xyz/file/";
    
    // Contract name and symbol for display purposes
    string public constant NAME = "EternalMint Pro";
    string public constant SYMBOL = "EMP";
    
    // Standard ERC functions that return the constants
    function name() public pure returns (string memory) {
        return NAME;
    }
    
    function symbol() public pure returns (string memory) {
        return SYMBOL;
    }

    // Struct to store token details
    struct Token {
        uint256 supply;
        address creator;
        string cid;
    }

    // Security controls
    uint256 public constant MAX_BATCH_SIZE = 100;

    // Mapping from token ID to metadata
    mapping(uint256 => Token) public tokens;

    // Array of all token IDs
    uint256[] public tokenIds;

    // Events
    event NftMinted(address indexed creator, uint256 indexed tokenId, uint256 supply, string cid);
    event BatchDistribution(
        address indexed distributor,
        uint256[] tokenIds,
        address[] recipients,
        uint256[] amounts,
        uint256 timestamp
    );
    event SingleDistribution(
        address indexed distributor,
        uint256 indexed tokenId,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );

    /**
     * @dev Constructor sets up admin role.
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // Modifiers
    modifier validRecipient(address recipient) {
        require(recipient != address(0), "Cannot transfer to zero address");
        require(recipient != msg.sender, "Cannot transfer to self");
        _;
    }

    modifier validBatchSize(uint256 size) {
        require(size > 0, "Batch cannot be empty");
        require(size <= MAX_BATCH_SIZE, "Batch size exceeds maximum limit");
        _;
    }

    // Allow contract admin OR NFT creator to distribute
    modifier canDistribute(uint256[] memory _tokenIds) {
        bool isAdmin = hasRole(DEFAULT_ADMIN_ROLE, msg.sender);
        bool isCreatorOfAll = true;
        
        // Check if sender is creator of all tokens being distributed
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            if (tokens[_tokenIds[i]].creator != msg.sender) {
                isCreatorOfAll = false;
                break;
            }
        }
        
        require(isAdmin || isCreatorOfAll, "Not authorized: must be contract admin or creator of all NFTs");
        _;
    }

    // For single token distributions
    modifier canDistributeSingle(uint256 tokenId) {
        bool isAdmin = hasRole(DEFAULT_ADMIN_ROLE, msg.sender);
        bool isCreator = tokens[tokenId].creator == msg.sender;
        
        require(isAdmin || isCreator, "Not authorized: must be contract admin or NFT creator");
        _;
    }

    /**
     * @dev Grants the MINTER_ROLE to a specified account.
     *
     * Requirements:
     * - The caller must have the DEFAULT_ADMIN_ROLE.
     *
     * @param account The address to be granted the MINTER_ROLE.
     */
    function addMinter(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(MINTER_ROLE, account);
    }

    /**
     * @dev Revokes the MINTER_ROLE from a specified account.
     *
     * Requirements:
     * - The caller must have the DEFAULT_ADMIN_ROLE.
     *
     * @param account The address from which the MINTER_ROLE will be revoked.
     */
    function removeMinter(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(MINTER_ROLE, account);
    }

    /**
     * @dev Generates a unique token ID based on the provided Content Identifier (CID).
     *
     * This function uses the keccak256 hash of the CID to ensure uniqueness.
     *
     * @param cid The Content Identifier associated with the NFT.
     * @return The generated unique token ID as a uint256.
     */
    function getTokenId(string memory cid) public pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(cid)));
    }

    /**
     * @dev Mints a new NFT with the specified CID and supply to the designated creator.
     *
     * The tokenId is derived from the `getTokenId` function using the CID.
     * This function ensures that a token with the same CID doesn't already exist.
     *
     * Requirements:
     * - The caller must have the MINTER_ROLE.
     *
     * @param creator The address that will be the creator of the minted NFT.
     * @param cid The Content Identifier associated with the NFT.
     * @param supply The number of tokens to mint.
     */
    function mint(address creator, string memory cid, uint256 supply) public onlyRole(MINTER_ROLE) {
        uint256 tokenId = getTokenId(cid);
        require(tokens[tokenId].supply == 0, "Token with this CID already exists");

        tokens[tokenId] = Token({supply: supply, creator: creator, cid: cid});
        tokenIds.push(tokenId);
        _mint(creator, tokenId, supply, "");
        
        emit NftMinted(creator, tokenId, supply, cid);
    }

    /**
     * @dev Distributes different NFTs to multiple recipients in a single transaction.
     * 
     * This is the most gas-efficient way to distribute multiple different NFTs.
     * Each recipient gets a specific NFT with a specific amount.
     *
     * Requirements:
     * - The caller must be the contract admin OR the creator of ALL NFTs being distributed.
     * - All arrays must have the same length.
     * - Caller must own sufficient balance of each NFT.
     *
     * @param recipients Array of recipient addresses.
     * @param _tokenIds Array of token IDs to distribute.
     * @param amounts Array of amounts for each token.
     */
    function batchTransfer(
        address[] memory recipients,
        uint256[] memory _tokenIds,
        uint256[] memory amounts
    ) 
        public 
        nonReentrant 
        validBatchSize(recipients.length)
        canDistribute(_tokenIds)
    {
        // Input validation
        require(recipients.length == _tokenIds.length, "Recipients and tokenIds length mismatch");
        require(_tokenIds.length == amounts.length, "TokenIds and amounts length mismatch");

        // Pre-flight checks - validate all transfers before executing any
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient address");
            require(recipients[i] != msg.sender, "Cannot transfer to self");
            require(amounts[i] > 0, "Amount must be greater than zero");
            require(balanceOf(msg.sender, _tokenIds[i]) >= amounts[i], "Insufficient balance for token");
            require(tokens[_tokenIds[i]].supply > 0, "Token does not exist");
        }

        // Execute all transfers
        for (uint256 i = 0; i < recipients.length; i++) {
            _safeTransferFrom(msg.sender, recipients[i], _tokenIds[i], amounts[i], "");
        }

        emit BatchDistribution(msg.sender, _tokenIds, recipients, amounts, block.timestamp);
    }

    /**
     * @dev Distributes the same NFT to multiple recipients.
     * 
     * More gas-efficient when distributing the same NFT to many people.
     *
     * Requirements:
     * - The caller must be the contract admin OR the creator of the NFT.
     * - Caller must own sufficient balance of the NFT.
     *
     * @param tokenId The token ID to distribute.
     * @param recipients Array of recipient addresses.
     * @param amounts Array of amounts for each recipient.
     */
    function distributeToMany(
        uint256 tokenId,
        address[] memory recipients,
        uint256[] memory amounts
    ) 
        public 
        nonReentrant 
        validBatchSize(recipients.length)
        canDistributeSingle(tokenId)
    {
        require(recipients.length == amounts.length, "Recipients and amounts length mismatch");
        require(tokens[tokenId].supply > 0, "Token does not exist");

        // Calculate total amount needed
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            require(amounts[i] > 0, "Amount must be greater than zero");
            totalAmount += amounts[i];
        }

        // Check if sender has enough balance for total distribution
        require(balanceOf(msg.sender, tokenId) >= totalAmount, "Insufficient total balance");

        // Validate recipients and execute transfers
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient address");
            require(recipients[i] != msg.sender, "Cannot transfer to self");
            _safeTransferFrom(msg.sender, recipients[i], tokenId, amounts[i], "");
        }

        // Create arrays for event emission
        uint256[] memory eventTokenIds = new uint256[](recipients.length);
        for (uint256 i = 0; i < recipients.length; i++) {
            eventTokenIds[i] = tokenId;
        }

        emit BatchDistribution(msg.sender, eventTokenIds, recipients, amounts, block.timestamp);
    }

    /**
     * @dev Distributes a single NFT to a single recipient.
     * 
     * Simpler and more gas-efficient for single transfers.
     * Useful for testing or small distributions.
     *
     * Requirements:
     * - The caller must be the contract admin OR the creator of the NFT.
     * - Caller must own sufficient balance of the NFT.
     *
     * @param tokenId The token ID to distribute.
     * @param recipient The recipient address.
     * @param amount The amount to transfer.
     */
    function distributeSingle(
        uint256 tokenId,
        address recipient,
        uint256 amount
    ) 
        public 
        nonReentrant
        validRecipient(recipient)
        canDistributeSingle(tokenId)
    {
        require(amount > 0, "Amount must be greater than zero");
        require(tokens[tokenId].supply > 0, "Token does not exist");
        require(balanceOf(msg.sender, tokenId) >= amount, "Insufficient balance");

        _safeTransferFrom(msg.sender, recipient, tokenId, amount, "");

        emit SingleDistribution(msg.sender, tokenId, recipient, amount, block.timestamp);
    }

    /**
     * @dev Gets all NFTs owned by a specific user.
     * 
     * Returns arrays of token IDs and their corresponding balances.
     * Useful for building user dashboards.
     *
     * @param user The address to query.
     * @return ownedTokenIds Array of token IDs owned by the user.
     * @return ownedBalances Array of balances for each owned token.
     */
    function getUserTokens(address user) public view returns (uint256[] memory ownedTokenIds, uint256[] memory ownedBalances) {
        uint256 totalTokens = tokenIds.length;
        uint256[] memory tempTokenIds = new uint256[](totalTokens);
        uint256[] memory tempBalances = new uint256[](totalTokens);
        uint256 ownedCount = 0;

        // Find all tokens owned by user
        for (uint256 i = 0; i < totalTokens; i++) {
            uint256 tokenId = tokenIds[i];
            uint256 balance = balanceOf(user, tokenId);
            if (balance > 0) {
                tempTokenIds[ownedCount] = tokenId;
                tempBalances[ownedCount] = balance;
                ownedCount++;
            }
        }

        // Create properly sized arrays
        ownedTokenIds = new uint256[](ownedCount);
        ownedBalances = new uint256[](ownedCount);
        
        for (uint256 i = 0; i < ownedCount; i++) {
            ownedTokenIds[i] = tempTokenIds[i];
            ownedBalances[i] = tempBalances[i];
        }

        return (ownedTokenIds, ownedBalances);
    }

    /**
     * @dev Checks if a user can distribute a specific NFT.
     * 
     * Returns true if the user is either the contract admin or the creator of the NFT.
     *
     * @param user The address to check.
     * @param tokenId The token ID to check.
     * @return Whether the user can distribute this NFT.
     */
    function canUserDistribute(address user, uint256 tokenId) public view returns (bool) {
        bool isAdmin = hasRole(DEFAULT_ADMIN_ROLE, user);
        bool isCreator = tokens[tokenId].creator == user;
        return isAdmin || isCreator;
    }

    /**
     * @dev Retrieves the Content Identifier (CID) associated with a specific token ID.
     *
     * @param tokenId The ID of the token for which the CID is requested.
     * @return The CID string linked to the provided token ID.
     */
    function getCid(uint256 tokenId) public view returns (string memory) {
        return tokens[tokenId].cid;
    }

    /**
     * @dev Returns the URI for a given token ID.
     * This function is required for MetaMask and other wallets to display NFT metadata.
     * It returns the API endpoint that serves the JSON metadata for the token.
     *
     * @param tokenId The ID of the token for which the URI is requested.
     * @return The metadata URI for the specified token ID.
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        require(tokens[tokenId].supply > 0, "Token does not exist");
        return string(abi.encodePacked(GATEWAY_URL, tokens[tokenId].cid));
    }

    /**
     * @dev Returns the gateway URL for metadata.
     * @return The fixed gateway URL string.
     */
    function getGatewayUrl() public pure returns (string memory) {
        return GATEWAY_URL;
    }

    /**
     * @dev Retrieves the total supply of a specific token ID.
     *
     * @param tokenId The ID of the token for which the supply is requested.
     * @return The total number of tokens minted for the specified token ID.
     */
    function getSupply(uint256 tokenId) public view returns (uint256) {
        return tokens[tokenId].supply;
    }

    /**
     * @dev Retrieves the creator of a specific token ID.
     *
     * @param tokenId The ID of the token for which the creator is requested.
     * @return The address of the creator associated with the specified token ID.
     */
    function getCreator(uint256 tokenId) public view returns (address) {
        return tokens[tokenId].creator;
    }

    /**
     * @dev Retrieves the complete Token struct for a specific token ID.
     *
     * @param tokenId The ID of the token for which the details are requested.
     * @return The Token struct containing supply, creator, and CID information.
     */
    function getToken(uint256 tokenId) public view returns (Token memory) {
        return tokens[tokenId];
    }

    /**
     * @dev Retrieves a token ID from its index in the tokenIds array.
     *
     * @param index The index of the token ID to retrieve.
     * @return The token ID at the specified index.
     */
    function getTokenIdByIndex(uint256 index) public view returns (uint256) {
        return tokenIds[index];
    }

    /**
     * @dev Retrieves a Token struct from its index in the tokenIds array.
     *
     * @param index The index of the token for which the details are requested.
     * @return The Token struct containing supply, creator, and CID information.
     */
    function getTokenByIndex(uint256 index) public view returns (Token memory) {
        return tokens[tokenIds[index]];
    }

    /**
     * @dev Returns the total number of tokens.
     * @return The total number of tokens.
     */
    function getTokenCount() public view returns (uint256) {
        return tokenIds.length;
    }

    /**
     * @dev Checks if a specific interface is supported by this contract.
     *
     * This function overrides the supportsInterface function from both ERC1155 and AccessControl.
     *
     * @param interfaceId The interface identifier, as specified in ERC-165.
     * @return `true` if the contract implements the specified interface, `false` otherwise.
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
