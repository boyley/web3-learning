// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title StructsEnums 结构体与枚举教学合约
 * @notice 教学用途，未经审计，勿直接上主网。
 * @dev 本合约聚焦 struct（自定义结构体）与 enum（枚举）。
 *      直接复制到 https://remix.ethereum.org 即可编译并部署到 Remix VM 调用。
 *
 * 本模块要点：
 *  1. struct 定义与三种初始化方式；
 *  2. struct 存进 mapping / 数组；
 *  3. 修改 storage 中的 struct（storage 引用 vs memory 拷贝的区别）；
 *  4. enum 定义、默认值为第 0 个成员、enum 与 uint 互转；
 *  5. 用 enum 表示状态机（订单状态流转）。
 */
contract StructsEnums {
    // ============================================================
    // 一、enum：枚举（表示有限状态）
    // ============================================================

    // enum 底层就是 uint（从 0 开始编号）。
    // Pending=0, Shipped=1, Delivered=2, Canceled=3。
    // ⚠️ 状态变量若不显式赋值，默认是「第 0 个成员」即 Pending。
    enum Status {
        Pending,   // 0 待处理
        Shipped,   // 1 已发货
        Delivered, // 2 已送达
        Canceled   // 3 已取消
    }

    // ============================================================
    // 二、struct：结构体（把多个字段打包成一个类型）
    // ============================================================

    struct Order {
        uint256 id;
        address buyer;
        uint256 amount;
        Status status; // struct 里可以嵌套 enum
    }

    // struct 存进 mapping：id => Order
    mapping(uint256 => Order) public orders;

    // struct 存进动态数组
    Order[] public orderList;

    uint256 public nextId; // 自增订单号

    // ------------------------------------------------------------
    // struct 的三种初始化方式
    // ------------------------------------------------------------

    /// @notice 方式一：具名字段（推荐，可读性最好，字段顺序无所谓）
    function createNamed(address buyer, uint256 amount) external returns (uint256 id) {
        id = nextId++;
        orders[id] = Order({
            id: id,
            buyer: buyer,
            amount: amount,
            status: Status.Pending // 显式写默认状态
        });
        orderList.push(orders[id]); // 把这份数据也拷贝进数组
    }

    /// @notice 方式二：按位置传参（顺序必须与字段声明一致，易错）
    function createPositional(address buyer, uint256 amount) external returns (uint256 id) {
        id = nextId++;
        // 参数顺序 = id, buyer, amount, status
        orders[id] = Order(id, buyer, amount, Status.Pending);
        orderList.push(orders[id]);
    }

    /// @notice 方式三：先建空 struct 再逐字段赋值
    function createEmptyThenFill(address buyer, uint256 amount) external returns (uint256 id) {
        id = nextId++;
        // 直接拿到 storage 中的引用（此时各字段都是默认值：0 / 零地址 / Pending）
        Order storage o = orders[id];
        o.id = id;
        o.buyer = buyer;
        o.amount = amount;
        // o.status 不赋值也行，默认就是 Status.Pending(0)
        orderList.push(o);
    }

    // ------------------------------------------------------------
    // 修改 storage 中的 struct：storage 引用 vs memory 拷贝
    // ------------------------------------------------------------

    /// @notice 用 storage 引用修改：会真正改到链上数据 ✅
    function ship(uint256 id) external {
        Order storage o = orders[id]; // storage 引用，指向原数据
        require(o.status == Status.Pending, "only pending can ship");
        o.status = Status.Shipped; // 直接改到链上
    }

    /// @notice 反例：用 memory 拷贝修改，不会影响链上数据 ❌（仅作教学对照）
    function shipButWrong(uint256 id) external view returns (Status) {
        Order memory o = orders[id]; // memory 是一份拷贝
        o.status = Status.Shipped;   // 只改了内存副本，函数结束即丢弃
        return o.status;             // 返回 Shipped，但 orders[id] 其实没变
    }

    /// @notice 读取订单状态
    function statusOf(uint256 id) external view returns (Status) {
        return orders[id].status;
    }

    // ============================================================
    // 三、enum 与 uint 的转换 + 状态机推进
    // ============================================================

    /// @notice enum 转 uint：显式 uint256(enum)
    function statusAsUint(uint256 id) external view returns (uint256) {
        return uint256(orders[id].status);
    }

    /// @notice uint 转 enum：Status(n)。
    /// @dev ⚠️ 0.8 起，若 n 超出枚举成员数量会 revert（Panic 0x21），起到边界保护。
    function setStatusByUint(uint256 id, uint256 raw) external {
        orders[id].status = Status(raw); // raw 必须是 0~3，否则 revert
    }

    /// @notice 状态机推进：按 Pending → Shipped → Delivered 顺序流转
    function advance(uint256 id) external {
        Order storage o = orders[id];
        require(o.status != Status.Delivered, "already delivered");
        require(o.status != Status.Canceled, "canceled order");
        // 把 enum 当 uint 加 1 推进到下一个状态
        o.status = Status(uint256(o.status) + 1);
    }

    /// @notice 取消订单（任何未送达状态都可取消）
    function cancel(uint256 id) external {
        Order storage o = orders[id];
        require(o.status != Status.Delivered, "delivered cannot cancel");
        o.status = Status.Canceled;
    }

    /// @notice 返回数组里订单数量
    function orderCount() external view returns (uint256) {
        return orderList.length;
    }
}
