import { ethers } from "ethers";
import { config } from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables
config();

async function main() {
  console.log("Testing certificate persistence...");
  
  try {
    // Create provider for Monad Testnet
    const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz/");
    
    // Read contract artifact
    const artifactPath = path.join(process.cwd(), "artifacts", "contracts", "LearningCredential.sol", "LearningCredential.json");
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    
    // Contract address (use the latest deployed address)
    const contractAddress = "0x6c2acEdEF5BE55f89CfBeFA6d438A6750e17B108";
    
    // Create contract instance
    const contract = new ethers.Contract(contractAddress, artifact.abi, provider);
    
    // Get contract owner
    const owner = await contract.owner();
    console.log("Contract owner:", owner);
    
    // Test a range of token IDs to find existing certificates
    console.log("Searching for existing certificates...");
    for (let tokenId = 1; tokenId <= 10; tokenId++) {
      try {
        const status = await contract.certificateStatus(tokenId);
        if (status !== "不存在") {
          console.log(`Found certificate #${tokenId}`);
          console.log("Status:", status);
          
          // Get certificate metadata
          const metadata = await contract.getMetadata(tokenId);
          console.log("Metadata:", metadata);
          
          // Get history count
          const historyCount = await contract.getHistoryCount(tokenId);
          console.log("History count:", historyCount.toString());
          
          // Get history entries
          if (historyCount > 0) {
            for (let i = 0; i < historyCount; i++) {
              const entry = await contract.getHistoryEntry(tokenId, i);
              console.log(`History entry ${i}:`, {
                eventType: entry.eventType,
                operator: entry.operator,
                details: entry.details,
                timestamp: new Date(entry.timestamp * 1000).toLocaleString()
              });
            }
          }
          return; // Found and tested a certificate, exit
        }
      } catch (error) {
        // Continue to next token ID
      }
    }
    
    console.log("No existing certificates found. You may need to mint a certificate first.");
    console.log("Persistence test completed!");
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});