// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MappingsArrays 映射与数组教学合约
 * @notice 教学用途，未经审计，勿直接上主网。
 * @dev 本合约聚焦两大引用类型：mapping（映射）与 array（数组）。
 *      直接复制到 https://remix.ethereum.org 即可编译并部署到 Remix VM 调用。
 *
 * 本模块要点：
 *  1. mapping(address => uint) 做「余额表」；
 *  2. 嵌套 mapping（如 allowance：owner => spender => amount）；
 *  3. mapping 的特性：不可遍历、没有 length、访问不存在的 key 返回类型默认值；
 *  4. 定长数组 vs 动态数组，push / pop / length；
 *  5. 数组作为返回值 / 循环遍历的 gas 风险。
 */
contract MappingsArrays {
    // ============================================================
    // 一、mapping：键值对存储
    // ============================================================

    // 余额表：把每个 address 映射到一个 uint 余额。
    // mapping 只能声明在 storage（状态变量），不能作为函数局部变量或返回整个 mapping。
    // 特性：所有 key 默认都「已存在」，值为类型默认值（uint 默认 0）。
    mapping(address => uint256) public balances;

    // 嵌套 mapping：模拟 ERC20 的 allowance。
    // 含义：owner 授权给 spender 的额度。访问方式 allowance[owner][spender]。
    mapping(address => mapping(address => uint256)) public allowance;

    /// @notice 给某地址充值（写入 mapping）
    function deposit(address user, uint256 amount) external {
        // mapping 直接用 [] 读写，没有「初始化」步骤。
        balances[user] += amount;
    }

    /// @notice 读取余额。注意：即使从未 deposit 过，也不会报错，返回 0。
    function balanceOf(address user) external view returns (uint256) {
        return balances[user];
    }

    /// @notice 设置嵌套 mapping 的值
    function approve(address owner, address spender, uint256 amount) external {
        allowance[owner][spender] = amount;
    }

    /// @notice 读取嵌套 mapping 的值
    function getAllowance(address owner, address spender) external view returns (uint256) {
        return allowance[owner][spender];
    }

    // ⚠️ mapping 无法遍历：没有 keys 列表、没有 length。
    //    若确需遍历，必须自己额外维护一个「key 数组」（见下方 users 模式）。
    address[] public users; // 记录所有充值过的用户，配合 mapping 实现「可遍历」

    mapping(address => bool) private _seen; // 防止同一用户重复进 users 数组

    /// @notice 充值同时登记用户，演示 mapping + array 组合以支持遍历
    function depositAndTrack(address user, uint256 amount) external {
        balances[user] += amount;
        if (!_seen[user]) {
            _seen[user] = true;
            users.push(user); // 动态数组追加
        }
    }

    /// @notice 遍历所有用户，累加总余额。
    /// @dev ⚠️ Gas 风险：users 越大，循环越贵，可能超出区块 gas 上限而永远失败。
    function totalBalance() external view returns (uint256 total) {
        for (uint256 i = 0; i < users.length; i++) {
            total += balances[users[i]];
        }
    }

    // ============================================================
    // 二、array：数组
    // ============================================================

    // 1) 定长数组：长度编译期固定，不能 push/pop。
    uint256[3] public fixedNumbers; // 默认 [0, 0, 0]

    /// @notice 修改定长数组的某个下标
    function setFixed(uint256 index, uint256 value) external {
        // 访问越界（index >= 3）会 revert（Panic 0x32）。
        fixedNumbers[index] = value;
    }

    // 2) 动态数组：长度可变，支持 push/pop/length。
    uint256[] public dynamicNumbers;

    /// @notice 尾部追加元素
    function push(uint256 value) external {
        dynamicNumbers.push(value); // 长度 +1
    }

    /// @notice 弹出尾部元素（长度 -1）。数组为空时 pop 会 revert。
    function pop() external {
        dynamicNumbers.pop();
    }

    /// @notice 返回动态数组长度
    function length() external view returns (uint256) {
        return dynamicNumbers.length;
    }

    /// @notice 删除某下标：delete 只是把该位置重置为默认值 0，长度不变、不会「补位」。
    function removeAt(uint256 index) external {
        delete dynamicNumbers[index]; // dynamicNumbers[index] = 0，其他元素不动
    }

    /// @notice 「swap & pop」惯用法：把要删的元素与末尾交换后 pop，O(1) 删除但不保序。
    function removeUnordered(uint256 index) external {
        uint256 last = dynamicNumbers.length - 1;
        dynamicNumbers[index] = dynamicNumbers[last];
        dynamicNumbers.pop();
    }

    /// @notice 返回整个数组。
    /// @dev ⚠️ 数组很大时，把整个数组作为返回值会消耗大量 gas / 可能无法调用。
    ///      view 调用（eth_call）不花实际 gas，但仍受节点限制；链上合约间调用要格外小心。
    function getAll() external view returns (uint256[] memory) {
        return dynamicNumbers;
    }

    /// @notice 在 memory 中创建定长数组并填充，演示 memory 数组用 new 分配、不能 push。
    function buildInMemory(uint256 n) external pure returns (uint256[] memory) {
        // memory 动态数组必须用 new 指定长度，之后长度不可变、不能 push/pop。
        uint256[] memory arr = new uint256[](n);
        for (uint256 i = 0; i < n; i++) {
            arr[i] = i * i;
        }
        return arr;
    }
}
