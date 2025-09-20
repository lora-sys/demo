# 区块链学习证书 Demo

一个基于以太坊的 NFT 学习证书发行与验证系统。该项目允许教育机构或个人为学员颁发区块链证书，并提供证书验证功能。

## 技术栈

- **后端**：
  - Solidity (智能合约)
  - Hardhat (开发环境)
  - Ethers.js (区块链交互)

- **前端**：
  - React (用户界面)
  - Ethers.js (区块链交互)
  - Tailwind CSS (样式)

## 安装依赖

### 后端

```bash
cd backend
npm install
```

### 前端

```bash
cd frontend
npm install
```

## 环境配置

项目使用 `.env` 文件存储敏感信息。在 `backend` 目录中创建 `.env` 文件：

```env
ALCHEMY_API_KEY=your_alchemy_api_key
WALLET_PRIVATE_KEY=your_wallet_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

注意：在本地开发环境中，你主要需要 `WALLET_PRIVATE_KEY` 来部署合约。

## 运行项目

### 1. 启动本地区块链网络

```bash
cd backend
npx hardhat node
```

### 2. 部署智能合约

在新的终端窗口中：

```bash
cd backend
npx hardhat run scripts/deployToLocal.js --network localhost
```

### 3. 启动前端应用

```bash
cd frontend
npm run dev
```

前端应用将在 `http://localhost:5173` 上运行。

## 演示流程

1. **访问应用**：
   打开浏览器访问 `http://localhost:5173`

2. **连接钱包**：
   - 点击"连接钱包"按钮
   - 在 MetaMask 中选择 Hardhat 网络的第一个账户（0xf39F...2266）
   - 确保网络设置为 Localhost 8545

3. **颁发证书**：
   - 填写学员姓名、课程名称、颁发机构和日期
   - 点击"生成证书并上链"按钮
   - 在 MetaMask 中确认交易

4. **验证证书**：
   - 复制交易哈希
   - 在验证部分粘贴交易哈希
   - 点击"验证"按钮
   - 查看验证结果和证书信息

## 项目结构

```
project/
├── backend/
│   ├── contracts/          # 智能合约
│   ├── scripts/            # 部署脚本
│   └── hardhat.config.js   # Hardhat 配置
└── frontend/
    ├── src/
    │   ├── contracts/      # 合约 ABI 和地址
    │   └── CertificatePage.jsx  # 主要组件
    └── vite.config.js      # Vite 配置
```