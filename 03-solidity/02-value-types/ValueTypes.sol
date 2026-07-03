// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================
// ValueTypes —— Solidity 值类型（Value Types）总览
// 教学用途，未经审计，勿直接上主网。
// ============================================================
//
// 「值类型」的含义：赋值或传参时「按值拷贝」一份，互不影响。
// 常见值类型：bool、整型（uint/int 及其位宽变体）、address、定长字节 bytesN、
//            enum、以及定长的 bytes1..bytes32。
// （string / 动态 bytes / array / mapping / struct 属于「引用类型」，不在本模块。）
//
// 本合约把每类值类型都用 public 状态变量展示：部署后可直接点自动 getter 观察默认/取值。
//
contract ValueTypes {
    // ============ 1) bool 布尔 ============
    // 取值只有 true / false 两种；默认值为 false。
    bool public flagDefault;          // 未赋值 → 默认 false
    bool public flagTrue = true;      // 显式赋 true

    // ============ 2) uint 无符号整数 ============
    // uint 是 uint256 的别名（256 位）。位宽以 8 为步长：uint8, uint16, ..., uint256。
    // 默认值均为 0。无符号 = 只能表示 0 和正数。
    //   uint8  范围：0 ~ 2^8 - 1   = 0 ~ 255
    //   uint256范围：0 ~ 2^256 - 1（天文数字，常用于金额 / wei）
    uint8   public smallNumber = 255;     // uint8 的最大值
    uint256 public bigNumber   = 1000;    // 等价写成 uint public bigNumber
    uint    public zeroDefault;           // 默认 0

    // ============ 3) int 有符号整数 ============
    // int 是 int256 的别名；可表示负数。默认值 0。
    //   int8  范围：-2^7 ~ 2^7 - 1  = -128 ~ 127
    //   int256范围：-2^255 ~ 2^255 - 1
    int256 public signedNumber = -42;     // 负数演示

    // ============ 4) address 地址 ============
    // address 保存 20 字节（40 个十六进制字符）的以太坊地址。默认值 0x000...000。
    // 成员示例：
    //   .balance  → 该地址的以太余额（单位 wei，类型 uint256）
    // 区分两种地址：
    //   - address          ：普通地址，不能直接接收/发送 ETH 的转账方法
    //   - address payable  ：可支付地址，额外拥有 .transfer() / .send() 转账能力
    // 二者可相互转换：payable(addr) 把 address 转成 address payable。
    address         public someAddress = 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4; // Remix 常见示例地址
    address payable public payableAddress = payable(0x5B38Da6a701c568545dCfcB03FcB875f56beddC4);
    address         public zeroAddress;   // 默认 0x0000000000000000000000000000000000000000

    // 读取某地址的余额（wei）。演示 address 成员 .balance 的用法。
    // 传入任意地址，返回其链上 ETH 余额。view：只读不改状态。
    function getBalance(address _addr) public view returns (uint256) {
        return _addr.balance;  // .balance 是 address 的内置成员，类型为 uint256
    }

    // ============ 5) bytesN 定长字节 ============
    // bytes1, bytes2, ..., bytes32 是「定长」字节数组，属于值类型。默认值全为 0 字节。
    // 与动态的 bytes / string 不同：bytesN 长度固定、更省 gas，常用于存哈希、标志位等。
    //   bytes1  = 1 字节，   bytes32 = 32 字节（正好装下一个 keccak256 哈希）
    bytes1  public oneByte  = 0xAB;                                                    // 单字节
    bytes32 public wordHash = keccak256(abi.encodePacked("hello"));                    // 32 字节哈希演示
    bytes32 public zeroBytes32;                                                        // 默认全 0

    // ============ 类型转换演示 ============
    // 数值类型之间可显式转换，但要注意「截断」与「符号」：
    //   - 大位宽 → 小位宽 会截断高位（可能丢数据），需显式转换：uint8(x)
    //   - 无符号 <-> 有符号 也需显式转换，注意负数/补码解释
    // 下面把 uint256 转成 uint8：结果 = 原值 mod 256（超出即被截断）。
    function downcast(uint256 _v) public pure returns (uint8) {
        return uint8(_v);   // 例如 256 → 0，257 → 1，因为只保留低 8 位
    }

    // 把普通 address 显式转换为 address payable。
    function toPayable(address _addr) public pure returns (address payable) {
        return payable(_addr);
    }
}
