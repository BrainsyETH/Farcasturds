// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {FarcasturdsV2} from "../src/FarcasturdsV2.sol";

contract DeployV2 is Script {
    // Deployment parameters
    string constant BASE_URI = "https://farcasturds.vercel.app/api/metadata/";
    uint256 constant MINT_PRICE = 0.001 ether; // 1000000000000000 wei

    function run() external returns (FarcasturdsV2) {
        // Get deployer from environment
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("\n==========================================");
        console2.log("Deploying FarcasturdsV2 to Base Mainnet");
        console2.log("==========================================\n");
        console2.log("Deployer:", deployer);
        console2.log("Balance:", deployer.balance / 1e18, "ETH");
        console2.log("Base URI:", BASE_URI);
        console2.log("Mint Price:", MINT_PRICE / 1e18, "ETH");
        console2.log("Chain ID:", block.chainid);
        console2.log("\n");

        // Verify we're on Base Mainnet
        require(block.chainid == 8453, "Must deploy to Base Mainnet (chain ID 8453)");

        // Verify deployer has enough ETH (0.005 ETH should be sufficient for Base deployment)
        require(deployer.balance >= 0.005 ether, "Insufficient ETH for deployment");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy contract
        FarcasturdsV2 farcasturds = new FarcasturdsV2(BASE_URI, MINT_PRICE);

        vm.stopBroadcast();

        // Verify deployment
        console2.log("\n==========================================");
        console2.log("Deployment Successful!");
        console2.log("==========================================\n");
        console2.log("Contract Address:", address(farcasturds));
        console2.log("Owner:", farcasturds.owner());
        console2.log("Name:", farcasturds.name());
        console2.log("Symbol:", farcasturds.symbol());
        console2.log("Mint Price:", farcasturds.mintPrice() / 1e18, "ETH");
        console2.log("Total Supply:", farcasturds.totalSupply());
        console2.log("\n");

        console2.log("Next steps:");
        console2.log("1. Verify contract on BaseScan");
        console2.log("2. Update .env.local with:");
        console2.log("   NEXT_PUBLIC_FARCASTURDS_V2_ADDRESS=", address(farcasturds));
        console2.log("3. Test mint function");
        console2.log("4. Deploy frontend to production");
        console2.log("\n");

        return farcasturds;
    }
}
