# 区块链证书系统

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-4-green.svg)](https://vitejs.dev/)

基于区块链技术的数字证书发行与验证系统，确保学历和证书的真实性与不可篡改性。

## 🌟 项目特色

### 🔗 区块链技术
- 基于 Monad 测试网构建
- 使用智能合约确保证书不可篡改
- 完整的 NFT 证书生命周期管理

### 🛡️ 安全验证机制
- **内容完整性验证**：通过哈希算法验证证书内容
- **地址锁定保护**：连续3次验证失败自动锁定地址1小时
- **血缘追溯**：完整的证书历史记录追踪

### 🎨 现代化界面
- 响应式卡片式设计
- 流畅的交互动画
- 直观的操作流程

## 🚀 快速开始

### 环境要求
- Node.js >= 16
- npm 或 yarn
- MetaMask 浏览器扩展

### 安装依赖
```bash
npm install
```

### 开发环境
```bash
npm run dev
```

### 生产构建
```bash
npm run build
```

### 本地预览
```bash
npm run preview
```

## 📁 项目结构

```
blockchain-cert-demo/
├── backend/
│   ├── contracts/
│   │   ├── LearningCredential.sol          # 主要证书合约
│   │   └── SecureContentValidator.sol     # 安全验证合约
│   ├── scripts/
│   │   ├── deployToMonadTestnet.js        # 部署脚本
│   │   └── deploySecureValidator.js       # 安全验证器部署
│   ├── hardhat.config.js                  # Hardhat配置
│   └── package.json                       # 后端依赖
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── CertificatePage.jsx         # 主要页面组件
│   │   ├── contracts/
│   │   │   ├── LearningCredential.json     # 合约ABI和地址
│   │   │   └── SecureContentValidator.json # 安全验证器ABI
│   │   ├── App.jsx                         # 应用入口
│   │   └── main.jsx                        # 主文件
│   ├── public/
│   │   └── demo.html                       # 演示页面
│   ├── package.json                        # 前端依赖
│   └── vite.config.js                      # Vite配置
└── README.md                              # 项目说明
```

## 🎯 核心功能

### 1. 证书发行
- 连接钱包创建证书
- 生成NFT证书并上链
- 自动记录铸造历史

### 2. 证书验证
- 通过交易哈希验证证书真实性
- 查看证书详细信息和状态
- 区块链浏览器链接跳转

### 3. 安全内容验证
- 基于哈希的内容完整性验证
- 地址锁定保护机制
- 验证日志审计追踪

### 4. 血缘追溯
- 完整的证书生命周期记录
- 事件时间线可视化展示
- 管理员撤销功能

## 🔧 技术栈

- **框架**: React 18 + Vite
- **状态管理**: React Hooks
- **区块链交互**: Ethers.js
- **智能合约**: Solidity 0.8.20
- **开发框架**: Hardhat
- **构建工具**: Vite
- **部署**: Vercel

## 🌐 网络配置

### 支持的区块链网络
- **Monad Testnet** (Chain ID: 10143)
- RPC URL: `https://testnet-rpc.monad.xyz/`
- 区块浏览器: `https://testnet.monadexplorer.com/`

### MetaMask 网络设置
1. 网络名称: `Monad Testnet`
2. RPC URL: `https://testnet-rpc.monad.xyz/`
3. 链ID: `10143`
4. 货币符号: `MONA`
5. 区块浏览器URL: `https://testnet.monadexplorer.com/`

## 🔒 安全机制

### 地址锁定保护
- 连续3次验证失败后自动锁定地址
- 锁定持续时间：1小时
- 锁定期间拒绝所有验证请求
- 自动解锁机制

### 内容完整性验证
- 使用keccak256哈希算法
- 防止证书内容被篡改
- 实时验证反馈

### 权限控制
- 合约所有者权限管理
- 管理员撤销证书权限
- 用户只读验证权限

## 📱 响应式设计

- 支持桌面端和移动端
- 自适应网格布局
- 触摸友好的交互设计

## 🚀 部署

### Vercel 部署
```bash
# 安装 Vercel CLI
npm install -g vercel

# 部署
vercel
```

### 环境变量配置
```bash
VITE_CONTRACT_ADDRESS=0x6c2acEdEF5BE55f89CfBeFA6d438A6750e17B108
VITE_SECURE_VALIDATOR_ADDRESS=0x51Ff6c11163e7da9Bc939808bd27a136b518F2Fc
VITE_RPC_URL=https://testnet-rpc.monad.xyz/
VITE_CHAIN_ID=10143
VITE_EXPLORER_URL=https://testnet.monadexplorer.com/
```

## 🛠️ 开发指南

### 代码规范
- 使用ESLint和Prettier保持代码一致性
- 遵循React最佳实践
- 组件化设计原则

### 测试策略
- 单元测试：Jest + React Testing Library
- 集成测试：Cypress
- 区块链测试：Hardhat网络

### 贡献流程
1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 发起 Pull Request

## 📊 性能优化

### 加载优化
- 代码分割和懒加载
- 资源压缩和优化
- CDN加速支持

### 交互优化
- 平滑的过渡动画
- 加载状态反馈
- 错误边界处理

## 🔗 相关链接

- [项目演示地址](https://blockchain-cert-demo.vercel.app)
- [区块链浏览器](https://testnet.monadexplorer.com/)
- [Monad文档](https://docs.monad.xyz/)
- [GitHub仓库](https://github.com/your-repo/blockchain-cert-demo)

## 🤝 支持与反馈

如有任何问题或建议，请通过以下方式联系我们：

- 提交 [GitHub Issues](https://github.com/your-repo/blockchain-cert-demo/issues)
- 发送邮件至 support@example.com
- 加入我们的 [Discord社区](https://discord.gg/example)

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解更多详情。

---

<p align="center">
  基于区块链技术的数字证书系统<br>
  确保学历和证书的真实性与不可篡改性
</p>