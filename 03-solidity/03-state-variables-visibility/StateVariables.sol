// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================
// StateVariables —— 状态变量与可见性（Visibility）
// 教学用途，未经审计，勿直接上主网。
// ============================================================
//
// 本合约讲清两件事：
//   (1) 4 种可见性 public / private / internal / external 分别用于「变量」还是「函数」；
//   (2) 状态变量按声明顺序存进 storage 槽位（slot 0, 1, 2 ...）。
//
// 重要观念：private / internal 只是「Solidity 语言层」的访问限制，
//           防止「别的合约代码」直接读写；但链上所有 storage 数据都是「公开可读」的，
//           任何人都能用 eth_getStorageAt 直接读到槽位里的原始值。
//           ⚠️ 所以：绝不要把私钥、密码等秘密写进合约变量！
//
contract StateVariables {
    // -------------------- 可见性 × 状态变量 --------------------
    // 状态变量可用的可见性只有 3 种：public / private / internal。
    // external 不能修饰状态变量（它只能修饰函数）——写了会编译报错。

    // slot 0：public 变量。编译器自动生成同名 getter：publicNumber()
    //         外部可读；子合约、外部合约都能读。
    uint256 public  publicNumber   = 100;

    // slot 1：internal 变量（不写可见性时默认就是 internal）。
    //         只有「本合约」和「继承它的子合约」内部可访问；外部不能直接读。
    uint256 internal internalNumber = 200;

    // slot 2：private 变量。只有「本合约内部」可访问；连子合约都不能访问。
    //         注意：private ≠ 保密！链上仍能被任何人从 slot 2 读到 300。
    uint256 private  privateNumber  = 300;

    // slot 3：一个 address，继续占用后续槽位，演示「顺序存储」。
    address public  owner;

    // 构造函数：部署时执行一次，把 owner 设为部署者地址。
    constructor() {
        owner = msg.sender;  // msg.sender 是当前调用者地址
    }

    // -------------------- 可见性 × 函数 --------------------
    // 函数可用的可见性有 4 种：public / private / internal / external。

    // public 函数：合约内、子合约、外部账户/合约都能调用。
    function readAll() public view returns (uint256, uint256, uint256) {
        // 本合约内部可以访问全部三个变量（含 private / internal）
        return (publicNumber, internalNumber, privateNumber);
    }

    // external 函数：只能被「外部」调用（其它合约或账户），
    //   本合约内部若想调用需写成 this.setPublicNumber(...)（相当于走一次外部调用，较贵）。
    //   适合「只对外暴露」的接口，通常比 public 处理 calldata 参数时更省 gas。
    function setPublicNumber(uint256 _v) external {
        publicNumber = _v;
    }

    // internal 函数：本合约 + 子合约内部可调用，外部不可见。常作为可复用的内部逻辑。
    function _double(uint256 _v) internal pure returns (uint256) {
        return _v * 2;
    }

    // private 函数：仅本合约内部可调用，子合约都看不到。
    function _tripleImpl(uint256 _v) private pure returns (uint256) {
        return _v * 3;
    }

    // public 函数内部演示：调用 internal / private 函数都没问题。
    function compute(uint256 _v) public pure returns (uint256 doubled, uint256 tripled) {
        doubled = _double(_v);      // 调 internal 函数 ✅
        tripled = _tripleImpl(_v);  // 调 private 函数 ✅
    }

    // 演示：private/internal 只是「代码层」限制，链上数据仍公开。
    // 这个函数返回 private 变量所在的 storage 槽号（这里是 slot 2），
    // 说明任何人都能用 eth_getStorageAt(合约地址, 2) 读到 privateNumber 的原始值。
    function privateNumberSlot() public pure returns (uint256) {
        assembly {
            // .slot 取状态变量的存储槽编号；用内联汇编读取并返回
            let s := privateNumber.slot
            mstore(0x00, s)
            return(0x00, 0x20)
        }
    }
}
