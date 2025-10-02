// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {EternalMintNfts} from "../src/EternalMintNfts.sol";

contract EternalMintNftsTest is Test {
    EternalMintNfts public eternalMintNfts;
    address public admin;
    address public minter;
    address public nonAdmin;
    address public nftCreator;

    // Define role identifiers using the same keccak256 hash as in the contract
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    /**
     * @dev Sets up the test environment by initializing role addresses and deploying the EternalMintNfts contract.
     */
    function setUp() public {
        admin = address(this); // The deploying address acts as admin
        minter = address(0x1);
        nonAdmin = address(0x2);
        nftCreator = address(0x3); // Address to act as the NFT creator in tests

        eternalMintNfts = new EternalMintNfts();
    }

    /**
     * @notice Tests that the admin has the DEFAULT_ADMIN_ROLE upon contract deployment.
     */
    function test_AdminHasDefaultAdminRole() public view {
        // Verify that the deployer has the DEFAULT_ADMIN_ROLE
        assertTrue(eternalMintNfts.hasRole(DEFAULT_ADMIN_ROLE, admin), "Admin should have DEFAULT_ADMIN_ROLE");
    }

    /**
     * @notice Tests that the admin can successfully grant the MINTER_ROLE to another address.
     */
    function test_AdminCanAddMinter() public {
        // Admin grants MINTER_ROLE to the minter address
        eternalMintNfts.addMinter(minter);

        // Verify that the minter role was granted
        assertTrue(eternalMintNfts.hasRole(MINTER_ROLE, minter), "Minter should have MINTER_ROLE");
    }

    /**
     * @notice Ensures that a non-admin cannot grant the MINTER_ROLE to another address.
     */
    function test_NonAdminCannotAddMinter() public {
        // Attempt to add a minter from a non-admin account
        vm.startPrank(nonAdmin);
        vm.expectRevert();
        eternalMintNfts.addMinter(minter);
        vm.stopPrank();

        // Verify that the minter role was not granted
        assertFalse(eternalMintNfts.hasRole(MINTER_ROLE, minter), "Minter should not have MINTER_ROLE");
    }

    /**
     * @notice Tests that the admin can revoke the MINTER_ROLE from an address.
     */
    function test_AdminCanRemoveMinter() public {
        // Admin grants MINTER_ROLE to the minter address
        eternalMintNfts.addMinter(minter);
        assertTrue(eternalMintNfts.hasRole(MINTER_ROLE, minter), "Minter should have MINTER_ROLE");

        // Admin revokes MINTER_ROLE from the minter address
        eternalMintNfts.removeMinter(minter);

        // Verify that the minter role was revoked
        assertFalse(eternalMintNfts.hasRole(MINTER_ROLE, minter), "Minter should not have MINTER_ROLE after revocation");
    }

    /**
     * @notice Ensures that a non-admin cannot revoke the MINTER_ROLE from an address.
     */
    function test_NonAdminCannotRemoveMinter() public {
        // Admin grants MINTER_ROLE to the minter address
        eternalMintNfts.addMinter(minter);
        assertTrue(eternalMintNfts.hasRole(MINTER_ROLE, minter), "Minter should have MINTER_ROLE");

        // Attempt to remove the minter role from a non-admin account
        vm.startPrank(nonAdmin);
        vm.expectRevert();
        eternalMintNfts.removeMinter(minter);
        vm.stopPrank();

        // Verify that the minter role was not revoked
        assertTrue(eternalMintNfts.hasRole(MINTER_ROLE, minter), "Minter should still have MINTER_ROLE");
    }

    /**
     * @notice Tests the `getTokenId` function to ensure it correctly derives the tokenId from a given CID.
     */
    function test_GetTokenId() public view {
        // Arrange
        string memory cid = "QmExampleCID1234567890";
        uint256 expectedTokenId = uint256(keccak256(abi.encodePacked(cid)));

        // Act
        uint256 tokenId = eternalMintNfts.getTokenId(cid);

        // Assert
        assertEq(tokenId, expectedTokenId, "Token ID should be the keccak256 hash of the CID");
    }

    /**
     * @notice Tests that an account with MINTER_ROLE can successfully mint an NFT.
     */
    function test_MinterCanMint() public {
        // Arrange
        string memory cid = "QmMintableCID1234567890";
        uint256 supply = 10;
        uint256 tokenId = eternalMintNfts.getTokenId(cid);

        // Admin grants MINTER_ROLE to the minter address
        eternalMintNfts.addMinter(minter);
        assertTrue(eternalMintNfts.hasRole(MINTER_ROLE, minter), "Minter should have MINTER_ROLE");

        // Simulate minter performing a mint action specifying the NFT creator
        vm.startPrank(minter);
        eternalMintNfts.mint(nftCreator, cid, supply);
        vm.stopPrank();

        // Assert that the nftCreator's balance is updated correctly
        assertEq(eternalMintNfts.balanceOf(nftCreator, tokenId), supply, "NFT creator should have the correct token balance");

        // Assert that the CID is correctly associated with the tokenId
        assertEq(eternalMintNfts.getCid(tokenId), cid, "CID should be correctly associated with tokenId");

        // Assert that the creator of the tokenId is the specified nftCreator
        assertEq(eternalMintNfts.getCreator(tokenId), nftCreator, "Creator should be the specified NFT creator address");
    }

    /**
     * @notice Tests that a non-minter cannot mint an NFT.
     */
    function test_NonMinterCannotMint() public {
        // Arrange
        string memory cid = "QmNonMinterCID1234567890";
        uint256 supply = 5;

        // Ensure nonAdmin does not have MINTER_ROLE
        assertFalse(eternalMintNfts.hasRole(MINTER_ROLE, nonAdmin), "Non-admin should not have MINTER_ROLE");

        // Act & Assert: Attempt to mint from a non-minter account should revert
        vm.startPrank(nonAdmin);
        vm.expectRevert();
        eternalMintNfts.mint(nftCreator, cid, supply);
        vm.stopPrank();
    }

    /**
     * @notice Tests that minting a duplicate CID is not allowed and reverts as expected.
     */
    function test_CannotMintDuplicateCID() public {
        // Arrange
        string memory cid = "QmDuplicateCID1234567890";
        uint256 supply = 2;

        // Admin grants MINTER_ROLE to the minter address
        eternalMintNfts.addMinter(minter);
        assertTrue(eternalMintNfts.hasRole(MINTER_ROLE, minter), "Minter should have MINTER_ROLE");

        // Simulate minter minting the token for the first time
        vm.startPrank(minter);
        eternalMintNfts.mint(nftCreator, cid, supply);
        vm.stopPrank();

        // Attempt to mint the same CID again, which should revert
        vm.startPrank(minter);
        vm.expectRevert("Token with this CID already exists");
        eternalMintNfts.mint(nftCreator, cid, supply);
        vm.stopPrank();
    }

    /**
     * @notice Tests the `getCid` function to ensure it returns the correct CID for a given tokenId.
     */
    function test_GetCID() public {
        // Arrange
        string memory cid = "QmGetCIDTest1234567890";
        uint256 supply = 3;
        uint256 tokenId = eternalMintNfts.getTokenId(cid);

        // Admin grants MINTER_ROLE to the minter address and mints the token
        eternalMintNfts.addMinter(minter);
        vm.startPrank(minter);
        eternalMintNfts.mint(nftCreator, cid, supply);
        vm.stopPrank();

        // Act: Retrieve the CID associated with the tokenId
        string memory retrievedCid = eternalMintNfts.getCid(tokenId);

        // Assert that the retrieved CID matches the original CID
        assertEq(retrievedCid, cid, "Retrieved CID should match the original CID");
    }

    /**
     * @notice Tests that the `supportsInterface` function correctly identifies implemented interfaces.
     */
    function test_SupportsInterface() public view {
        // Define interface IDs
        bytes4 erc1155InterfaceId = 0xd9b67a26;
        bytes4 accessControlInterfaceId = 0x7965db0b;
        bytes4 randomInterfaceId = 0xffffffff;

        // Assert that the contract supports ERC1155 interface
        assertTrue(eternalMintNfts.supportsInterface(erc1155InterfaceId), "Should support ERC1155 interface");

        // Assert that the contract supports AccessControl interface
        assertTrue(eternalMintNfts.supportsInterface(accessControlInterfaceId), "Should support AccessControl interface");

        // Assert that the contract does not support a random, undefined interface
        assertFalse(eternalMintNfts.supportsInterface(randomInterfaceId), "Should not support undefined interface");
    }

    /**
     * @notice Tests granting and revoking roles directly using `grantRole` and `revokeRole` functions.
     */
    function test_AdminCanGrantAndRevokeRolesDirectly() public {
        // Admin grants MINTER_ROLE to the minter address
        eternalMintNfts.grantRole(MINTER_ROLE, minter);
        assertTrue(eternalMintNfts.hasRole(MINTER_ROLE, minter), "Minter should have MINTER_ROLE after granting");

        // Admin revokes MINTER_ROLE from the minter address
        eternalMintNfts.revokeRole(MINTER_ROLE, minter);
        assertFalse(eternalMintNfts.hasRole(MINTER_ROLE, minter), "Minter should not have MINTER_ROLE after revocation");
    }
}
