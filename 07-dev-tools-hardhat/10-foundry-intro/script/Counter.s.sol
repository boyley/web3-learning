// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Foundry 的部署脚本也用 Solidity 写（不是 JS）。
import {Script, console} from "forge-std/Script.sol";
import {Counter} from "../src/Counter.sol";

contract CounterScript is Script {
    function run() public {
        // vm.startBroadcast/stopBroadcast 之间的交易会被真正广播上链
        vm.startBroadcast();

        Counter counter = new Counter();
        console.log("Counter deployed at:", address(counter));

        vm.stopBroadcast();
    }
}
