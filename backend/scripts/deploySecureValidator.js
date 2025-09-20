// scripts/deploySecureValidator.js
import { ethers } from "ethers";
import { config } from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables
config();

async function main() {
  console.log("Deploying SecureContentValidator to Monad Testnet...");
  
  try {
    // Create provider and signer for Monad Testnet
    const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz/", 10143);
    
    // Use the wallet private key from environment variables
    let privateKey = process.env.MONAD_TESTNET_PRIVATE_KEY;
    // 移除可能的0x前缀
    if (privateKey.startsWith('0x')) {
      privateKey = privateKey.slice(2);
    }
    // 确保私钥长度正确
    if (privateKey.length !== 64) {
      throw new Error("Invalid private key length");
    }
    
    const deployer = new ethers.Wallet(privateKey, provider);
    console.log("Deploying contract with account:", deployer.address);
    
    // Get deployer balance
    const balance = await provider.getBalance(deployer.address);
    console.log("Deployer balance:", ethers.formatEther(balance), "MONA");
    
    // Read contract artifact
    const artifactPath = path.join(process.cwd(), "artifacts", "contracts", "SecureContentValidator.sol", "SecureContentValidator.json");
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    
    // Contract ABI and bytecode from artifact
    const contractABI = artifact.abi;
    const contractBytecode = artifact.bytecode;
    
    // Create contract factory
    const factory = new ethers.ContractFactory(contractABI, contractBytecode, deployer);
    
    // Deploy the contract
    console.log("Deploying SecureContentValidator...");
    const secureValidator = await factory.deploy();
    
    // Wait for the deployment transaction to be mined
    await secureValidator.waitForDeployment();
    
    // Get the deployed contract address
    const contractAddress = await secureValidator.getAddress();
    
    console.log("SecureContentValidator deployed to:", contractAddress);
    
    // Verify the deployment by calling a view function
    const logsCount = await secureValidator.getVerificationLogsCount();
    console.log("Initial logs count:", logsCount.toString());
    
    console.log("SUCCESS: Contract deployed and verified!");
    
    // Save the contract information to files for later use
    // Save contract address
    fs.writeFileSync(
      ".contract-address-secure-validator",
      contractAddress,
      "utf8"
    );
    console.log("Contract address saved to .contract-address-secure-validator file");
    
    // Save contract ABI to frontend
    const frontendDir = path.join(process.cwd(), "..", "frontend", "src", "contracts");
    if (!fs.existsSync(frontendDir)) {
      fs.mkdirSync(frontendDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(frontendDir, "SecureContentValidator.json"),
      JSON.stringify({
        address: contractAddress,
        abi: contractABI
      }, null, 2)
    );
    console.log("Contract ABI saved to frontend/src/contracts/SecureContentValidator.json");
    
  } catch (error) {
    console.error("Deployment failed:", error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});