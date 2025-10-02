// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {EternalMintNfts} from "../src/EternalMintNfts.sol";

contract EternalMintNftsScript is Script {
    function setUp() public {}

    function run() public returns (EternalMintNfts) {
        // Get base URI from environment variable
        string memory baseURI = vm.envString("BASE_URI");
        
        // Log deployment info
        console.log("Deploying EternalMintNfts contract");
        console.log("Deployer address:", msg.sender);
        console.log("Chain ID:", block.chainid);
        console.log("Base URI:", baseURI);

        // Begin sending transactions
        vm.startBroadcast();

        EternalMintNfts eternalMintNfts = new EternalMintNfts(baseURI);
        console.log("EternalMintNfts deployed to:", address(eternalMintNfts));

        // Stop sending transactions
        vm.stopBroadcast();

        return eternalMintNfts;
    }
}
