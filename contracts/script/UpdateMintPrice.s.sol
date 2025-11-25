// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {FarcasturdsV3} from "../src/FarcasturdsV3.sol";

contract UpdateMintPrice is Script {
    address constant CONTRACT_ADDRESS = 0x99316cF6D2Ff8051Cd0dDfb2adCB0D23F7Ff3Ac3;
    uint256 constant NEW_MINT_PRICE = 0.001 ether; // 1000000000000000 wei

    function run() external {
        // Get owner private key from environment
        uint256 ownerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address owner = vm.addr(ownerPrivateKey);

        FarcasturdsV3 farcasturds = FarcasturdsV3(CONTRACT_ADDRESS);

        console2.log("\n==========================================");
        console2.log("Updating Mint Price");
        console2.log("==========================================\n");
        console2.log("Contract:", CONTRACT_ADDRESS);
        console2.log("Owner:", owner);
        console2.log("Current Mint Price:", farcasturds.mintPrice() / 1e18, "ETH");
        console2.log("New Mint Price:", NEW_MINT_PRICE / 1e18, "ETH");
        console2.log("\n");

        vm.startBroadcast(ownerPrivateKey);

        // Update mint price
        farcasturds.setMintPrice(NEW_MINT_PRICE);

        vm.stopBroadcast();

        console2.log("\n==========================================");
        console2.log("Update Successful!");
        console2.log("==========================================\n");
        console2.log("New Mint Price:", farcasturds.mintPrice() / 1e18, "ETH");
        console2.log("\n");
    }
}
