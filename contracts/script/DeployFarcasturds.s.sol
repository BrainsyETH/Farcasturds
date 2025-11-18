// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {Farcasturds} from "../src/Farcasturds.sol";

contract DeployFarcasturds is Script {
    function run() external {
        // Load private key from env
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        string memory baseURI = "https://api.farcasturd.app/metadata/"; // placeholder
        address minter = vm.addr(deployerKey); // for now, deployer = minter

        vm.startBroadcast(deployerKey);

        // Deploy Farcasturds contract
        Farcasturds farcasturds = new Farcasturds(minter, baseURI);

        vm.stopBroadcast();

        console2.log("Farcasturds deployed at:", address(farcasturds));
        console2.log("Minter address:", minter);
    }
}
