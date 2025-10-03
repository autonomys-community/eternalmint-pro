// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {EternalMintNfts} from "../src/EternalMintNfts.sol";

contract EternalMintNftsScript is Script {
    function setUp() public {}

    function run() public returns (EternalMintNfts) {
        // Log deployment info
        console.log("Deploying EternalMintNfts contract");
        console.log("Deployer address:", msg.sender);
        console.log("Chain ID:", block.chainid);
        console.log("Gateway URL: https://gateway.autonomys.xyz/file/");

        // Begin sending transactions
        vm.startBroadcast();

        EternalMintNfts eternalMintNfts = new EternalMintNfts();
        console.log("EternalMintNfts deployed to:", address(eternalMintNfts));

        // Stop sending transactions
        vm.stopBroadcast();

        return eternalMintNfts;
    }
}
