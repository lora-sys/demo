import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "dotenv/config";

export default {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [process.env.WALLET_PRIVATE_KEY],
      type: "http"
    },
    monadTestnet: {
      url: "https://testnet-rpc.monad.xyz/",
      accounts: [process.env.MONAD_TESTNET_PRIVATE_KEY],
      chainId: 10143,
      type: "http"
    },
    hardhat: {
      // Hardhat Network配置
      mining: {
        auto: true,
        interval: 0 // 立即挖矿
      },
      allowBlocksWithSameTimestamp: true,
      type: "edr-simulated"
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};