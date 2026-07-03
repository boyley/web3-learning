// SPDX-License-Identifier: MIT
// 教学用途，未经审计，勿直接上主网。
pragma solidity ^0.8.20;

// 注意：可升级合约用的是「另一个包」@openzeppelin/contracts-upgradeable，
// 里面每个合约都带 Upgradeable 后缀，且用 initializer 代替 constructor。
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title MyTokenUpgradeable
 * @notice 演示 UUPS 可升级代理模式：逻辑合约（Implementation）可被替换，
 *         但数据永远存在代理合约（Proxy）里，用户始终与同一个代理地址交互。
 * @dev 三个关键约定：
 *      1) 不能用 constructor 初始化状态（构造函数只在部署逻辑合约时跑，
 *         而状态活在代理里）→ 改用 initialize() + initializer 修饰器，且只能调一次。
 *      2) 逻辑合约自身的 constructor 里调用 _disableInitializers()，
 *         防止有人直接对「逻辑合约」调用 initialize 抢占它。
 *      3) UUPS 把「升级逻辑」放在实现合约里，必须实现 _authorizeUpgrade 做权限校验，
 *         否则任何人都能升级。这里用 onlyOwner 限制。
 */
contract MyTokenUpgradeable is
    Initializable,
    ERC20Upgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers(); // 锁死逻辑合约自身，防抢占初始化
    }

    /// @notice 代替构造函数。部署代理后调用一次，用 __Xxx_init 依次初始化各父合约。
    function initialize(address initialOwner) public initializer {
        __ERC20_init("UpgradeableToken", "UPT");
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        _mint(initialOwner, 1000 * 10 ** decimals());
    }

    /// @notice 升级授权钩子：只有 owner 能把代理指向新的逻辑合约。
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}

    // 升级注意：新版本只能在末尾「追加」状态变量，绝不能改动/删除/调换已有变量顺序，
    // 否则会「存储错位」污染数据。生产中用 OpenZeppelin Upgrades Plugins 自动校验。
}
