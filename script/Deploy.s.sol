// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {RepChain} from "../contracts/RepChain.sol";

/// @notice Deploy with:
///   export PRIVATE_KEY=0x...
///   export FEE_COLLECTOR=0x...
///   forge script script/Deploy.s.sol:Deploy --rpc-url monad_testnet --broadcast
contract Deploy is Script {
    function run() external returns (RepChain rc) {
        address feeCollector = vm.envAddress("FEE_COLLECTOR");
        uint256 pk = _readPrivateKey();

        vm.startBroadcast(pk);
        rc = new RepChain(feeCollector);
        vm.stopBroadcast();

        console2.log("RepChain deployed at:", address(rc));
        console2.log("Fee collector:", feeCollector);
    }

    /// Accepts PRIVATE_KEY with or without the `0x` prefix.
    function _readPrivateKey() internal view returns (uint256) {
        string memory s = vm.envString("PRIVATE_KEY");
        bytes memory b = bytes(s);
        if (b.length >= 2 && b[0] == "0" && (b[1] == "x" || b[1] == "X")) {
            return vm.parseUint(s);
        }
        return vm.parseUint(string(abi.encodePacked("0x", s)));
    }
}
