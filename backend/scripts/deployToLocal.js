// scripts/deployToLocal.js
import { ethers } from "ethers";
import { config } from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables
config();

async function main() {
  console.log("Deploying to local network...");
  
  try {
    // Create provider and signer for local network
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    
    // Use the first Hardhat network account for deployment
    // This is the same account that we'll use in MetaMask
    const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Account #0 from Hardhat network
    const deployer = new ethers.Wallet(privateKey, provider);
    console.log("Deploying contract with account:", deployer.address);
    
    // Get deployer balance
    const balance = await provider.getBalance(deployer.address);
    console.log("Deployer balance:", ethers.formatEther(balance), "ETH");
    
    // Read contract artifact
    const artifactPath = path.join(process.cwd(), "artifacts", "contracts", "LearningCredential.sol", "LearningCredential.json");
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    
    // Contract ABI and bytecode from artifact
    const contractABI = artifact.abi;
    const contractBytecode = artifact.bytecode;
    
    // Create contract factory
    const factory = new ethers.ContractFactory(contractABI, contractBytecode, deployer);
    
    // Deploy the contract with the deployer as the initial owner
    console.log("Deploying LearningCredential...");
    const learningCredential = await factory.deploy(deployer.address);
    
    // Wait for the deployment transaction to be mined
    await learningCredential.waitForDeployment();
    
    // Get the deployed contract address
    const contractAddress = await learningCredential.getAddress();
    
    console.log("LearningCredential deployed to:", contractAddress);
    console.log("Owner address:", deployer.address);
    
    // Verify the deployment
    const owner = await learningCredential.owner();
    console.log("Contract owner:", owner);
    
    if (owner.toLowerCase() === deployer.address.toLowerCase()) {
      console.log("SUCCESS: Contract deployed and ownership verified!");
    } else {
      console.log("WARNING: Contract owner does not match deployer address");
    }
    
    // Save the contract information to files for later use
    // Save contract address
    fs.writeFileSync(
      ".contract-address-local",
      contractAddress,
      "utf8"
    );
    console.log("Contract address saved to .contract-address-local file");
    
    // Save contract ABI to frontend
    const frontendDir = path.join(process.cwd(), "..", "frontend", "src", "contracts");
    if (!fs.existsSync(frontendDir)) {
      fs.mkdirSync(frontendDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(frontendDir, "LearningCredential.json"),
      JSON.stringify({
        address: contractAddress,
        abi: contractABI
      }, null, 2)
    );
    console.log("Contract ABI saved to frontend/src/contracts/LearningCredential.json");
    
  } catch (error) {
    console.error("Deployment failed:", error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});