import { ethers } from "ethers";
import { config } from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables
config();

async function main() {
  console.log("Testing SecureContentValidator logs...");
  
  try {
    // Create provider for Monad Testnet
    const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz/", 10143);
    
    // Read contract artifact
    const artifactPath = path.join(process.cwd(), "artifacts", "contracts", "SecureContentValidator.sol", "SecureContentValidator.json");
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    
    // Contract ABI and address
    const contractABI = artifact.abi;
    const contractAddress = "0x51Ff6c11163e7da9Bc939808bd27a136b518F2Fc"; // Use the latest deployed address
    
    // Create contract instance
    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    
    // Get logs count
    const logsCount = await contract.getVerificationLogsCount();
    console.log("Logs count:", logsCount.toString());
    
    if (logsCount > 0) {
      // Fetch logs (up to 5 most recent)
      const startIndex = logsCount > 5 ? logsCount - 5 : 0;
      const count = logsCount > 5 ? 5 : logsCount;
      
      console.log("Fetching logs from index", startIndex, "count", count);
      
      const logs = await contract.getVerificationLogs(startIndex, count);
      console.log("Logs:", logs);
      
      // Print each log
      for (let i = 0; i < logs.length; i++) {
        console.log(`Log ${i}:`, {
          user: logs[i].user,
          tokenId: logs[i].tokenId.toString(),
          contentHash: logs[i].contentHash,
          isValid: logs[i].isValid,
          timestamp: logs[i].timestamp.toString()
        });
      }
    } else {
      console.log("No logs found");
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});