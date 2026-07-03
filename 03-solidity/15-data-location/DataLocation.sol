// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DataLocation 数据位置演示（storage / memory / calldata）
 * @notice 教学用途，未经审计，勿直接上主网。
 * @dev 引用类型（数组、struct、mapping、string、bytes）必须显式标注「数据位置」，
 *      不同位置决定了：数据存在哪、能不能改、以及 gas 成本。
 *
 *      ── 三种数据位置 ──
 *        storage  : 永久存链上（状态变量默认在此）。读写贵（SLOAD/SSTORE）。
 *                   拿到 storage 引用 = 指向原数据的「指针」，改它就改了链上状态。
 *        memory   : 函数执行期间的临时内存，函数结束即释放。是「拷贝」，
 *                   改 memory 副本不会影响原 storage 数据。比 storage 便宜。
 *                   external 函数收到 memory 参数会把 calldata 拷进内存（有成本）。
 *        calldata : 只读、不可修改，专用于「函数入参」（尤其 external）。
 *                   不拷贝、直接读交易数据，最省 gas。
 *
 *      值类型（uint、bool、address 等）不需要写 data location，它们总是按值拷贝。
 */
contract DataLocation {
    /// @notice 一个结构体，用来演示引用类型的数据位置
    struct User {
        string name;
        uint256 score;
    }

    /// @notice 状态变量 —— 永久存在 storage
    uint256[] public numbers; // 动态数组，存 storage
    User public user; // struct，存 storage

    constructor() {
        numbers = [10, 20, 30];
        user = User("Alice", 100);
    }

    /**
     * @notice storage 引用：改副本 == 改原始状态。
     * @dev `storage` 局部变量是指向 numbers 的指针；给 ref[index] 赋值，
     *      直接写回链上的 numbers。调用后再读 numbers 会发现值变了。
     */
    function updateViaStorage(uint256 index, uint256 newValue) external {
        uint256[] storage ref = numbers; // 指针，指向状态变量 numbers
        ref[index] = newValue; // 等价于 numbers[index] = newValue
    }

    /**
     * @notice memory 拷贝：改副本不影响原始状态。
     * @dev 把 numbers 整体拷进 memory，修改的是拷贝，函数结束即丢弃。
     *      返回拷贝供你观察，但链上 numbers 纹丝不动。
     */
    function updateViaMemory(uint256 index, uint256 newValue) external view returns (uint256[] memory) {
        uint256[] memory copy = numbers; // 把 storage 数组整体拷到 memory
        copy[index] = newValue; // 只改内存副本
        return copy; // 原始 numbers 不受影响
    }

    /**
     * @notice calldata 入参：只读，最省 gas。
     * @dev external 函数的数组/字符串入参优先用 calldata：不拷贝、直接读交易数据。
     *      注意：calldata 不可修改，写 `data[0] = x` 会编译报错。
     *      这里只读取并求和。
     */
    function sumCalldata(uint256[] calldata data) external pure returns (uint256 total) {
        for (uint256 i = 0; i < data.length; i++) {
            total += data[i]; // 只读 calldata
        }
    }

    /**
     * @notice 对比 memory 入参：语义相同，但会把 calldata 拷进内存，略贵。
     * @dev 若函数内需要修改这份数据，才用 memory；否则 external 入参用 calldata 更省。
     */
    function sumMemory(uint256[] memory data) external pure returns (uint256 total) {
        data[0] = data[0]; // memory 可写（这里演示可写性，不改变结果）
        for (uint256 i = 0; i < data.length; i++) {
            total += data[i];
        }
    }

    /**
     * @notice 用 storage 引用修改 struct 字段，直接写回链上。
     */
    function renameUserStorage(string calldata newName) external {
        User storage u = user; // 指向状态变量 user
        u.name = newName; // 直接改链上 user.name
    }

    /**
     * @notice 用 memory 拷贝修改 struct，不影响链上（返回拷贝供观察）。
     */
    function renameUserMemory(string calldata newName) external view returns (User memory) {
        User memory u = user; // 拷贝
        u.name = newName; // 只改副本
        return u; // 链上 user 不变
    }

    /// @notice 便于观察：读取当前 numbers 全量
    function getNumbers() external view returns (uint256[] memory) {
        return numbers;
    }
}
