// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {FarcasturdsV3} from "../src/FarcasturdsV3.sol";

contract DeployV3 is Script {
    // Deployment parameters
    string constant BASE_URI = "https://farcasturds.vercel.app/api/metadata/";
    uint256 constant MINT_PRICE = 0.001 ether; // 1000000000000000 wei
    address constant TREASURY = 0xa27374DA87e7075e4D1AE5B81853dD7970C1841a;

    function run() external returns (FarcasturdsV3) {
        // Get deployer from environment
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("\n==========================================");
        console2.log("Deploying FarcasturdsV3 to Base Mainnet");
        console2.log("==========================================\n");
        console2.log("Deployer:", deployer);
        console2.log("Balance:", deployer.balance / 1e18, "ETH");
        console2.log("Base URI:", BASE_URI);
        console2.log("Mint Price:", MINT_PRICE / 1e18, "ETH");
        console2.log("Treasury:", TREASURY);
        console2.log("Chain ID:", block.chainid);
        console2.log("\n");

        // Verify we're on Base Mainnet
        require(block.chainid == 8453, "Must deploy to Base Mainnet (chain ID 8453)");

        // Verify deployer has enough ETH (0.01 ETH should be sufficient for Base deployment)
        require(deployer.balance >= 0.01 ether, "Insufficient ETH for deployment");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy contract
        FarcasturdsV3 farcasturds = new FarcasturdsV3(BASE_URI, MINT_PRICE, TREASURY);

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
        console2.log("Treasury:", farcasturds.treasury());
        console2.log("Total Supply:", farcasturds.totalSupply());
        console2.log("\n");

        console2.log("Next steps:");
        console2.log("1. Verify contract on BaseScan:");
        console2.log("   forge verify-contract", address(farcasturds), "FarcasturdsV3");
        console2.log("   --chain-id 8453 --watch");
        console2.log("\n2. Update .env.local with:");
        console2.log("   NEXT_PUBLIC_FARCASTURDS_ADDRESS=", address(farcasturds));
        console2.log("\n3. Update MintModal.tsx to use farcasturdsV3Abi");
        console2.log("\n4. Test authorization flow");
        console2.log("\n5. Deploy frontend to production");
        console2.log("\n");

        return farcasturds;
    }
}
