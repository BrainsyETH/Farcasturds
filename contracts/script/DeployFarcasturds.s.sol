// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/Farcasturds.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("FARCASTURDS_MINTER_PRIVATE_KEY");
        address minter = vm.addr(deployerPrivateKey);

        string memory baseURI = vm.envString("APP_BASE_URL");
        string memory metadataURI = string(abi.encodePacked(baseURI, "/api/metadata/"));

        // Mint price: 0.0001 ETH = 100000000000000 wei
        uint256 mintPrice = 100000000000000;

        vm.startBroadcast(deployerPrivateKey);

        Farcasturds farcasturds = new Farcasturds(
            minter,           // minter address
            metadataURI,      // base URI for metadata
            mintPrice         // mint price in wei
        );

        console.log("Farcasturds deployed to:", address(farcasturds));
        console.log("Minter address:", minter);
        console.log("Base URI:", metadataURI);
        console.log("Mint price:", mintPrice, "wei");

        vm.stopBroadcast();
    }
}