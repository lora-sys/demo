import { ethers } from "ethers";
import { config } from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables
config();

async function main() {
  console.log("Testing certificate validation...");
  
  try {
    // Create provider and signer for Monad Testnet
    const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz/");
    const privateKey = process.env.MONAD_TESTNET_PRIVATE_KEY.startsWith('0x') ? 
      process.env.MONAD_TESTNET_PRIVATE_KEY.slice(2) : 
      process.env.MONAD_TESTNET_PRIVATE_KEY;
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log("Using account:", wallet.address);
    
    // Read contract artifacts
    const learningCredentialArtifact = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "artifacts", "contracts", "LearningCredential.sol", "LearningCredential.json"), "utf8")
    );
    
    const secureValidatorArtifact = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "artifacts", "contracts", "SecureContentValidator.sol", "SecureContentValidator.json"), "utf8")
    );
    
    // Contract addresses (use the latest deployed addresses)
    const learningCredentialAddress = "0x628dd137142eac0b3a56e89f1758438326A6b43a";
    const secureValidatorAddress = "0x51Ff6c11163e7da9Bc939808bd27a136b518F2Fc";
    
    // Create contract instances
    const learningCredential = new ethers.Contract(learningCredentialAddress, learningCredentialArtifact.abi, provider);
    const secureValidator = new ethers.Contract(secureValidatorAddress, secureValidatorArtifact.abi, wallet);
    
    // Test certificate validation
    const tokenId = 1; // Use an existing token ID
    
    // Get certificate metadata
    const metadata = await learningCredential.getMetadata(tokenId);
    console.log("Certificate metadata:", metadata);
    
    // Parse metadata
    const parsedData = {};
    const pairs = metadata.split(', ');
    pairs.forEach(pair => {
      const [key, value] = pair.split(':');
      if (key && value) {
        parsedData[key.trim()] = value.trim();
      }
    });
    console.log("Parsed metadata:", parsedData);
    
    // Recreate the standardized content
    const standardizedContent = `姓名:${parsedData['姓名']}, 课程:${parsedData['课程']}, 机构:${parsedData['机构']}, 日期:${parsedData['日期']}`;
    console.log("Standardized content:", standardizedContent);
    
    // Calculate content hash
    const contentHash = ethers.keccak256(ethers.toUtf8Bytes(standardizedContent));
    console.log("Content hash:", contentHash);
    
    // Call the verifyContent function
    console.log("Calling verifyContent...");
    const tx = await secureValidator.verifyContent(standardizedContent, contentHash, tokenId);
    console.log("Transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
    
    // Check logs
    const logsCount = await secureValidator.getVerificationLogsCount();
    console.log("Logs count:", logsCount.toString());
    
    if (logsCount > 0) {
      const logs = await secureValidator.getVerificationLogs(0, 1);
      console.log("Latest log:", logs[0]);
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});