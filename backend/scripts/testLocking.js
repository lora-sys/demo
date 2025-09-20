import { ethers } from "ethers";
import { config } from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables
config();

async function main() {
  console.log("Testing address locking mechanism...");
  
  try {
    // Create provider for Monad Testnet
    const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz/");
    
    // Use the test private key (this will be a different address for testing)
    const testPrivateKey = "0x1234567890123456789012345678901234567890123456789012345678901234"; // 测试用私钥
    const testWallet = new ethers.Wallet(testPrivateKey, provider);
    
    console.log("Test wallet address:", testWallet.address);
    
    // Read secure validator contract artifact
    const artifactPath = path.join(process.cwd(), "artifacts", "contracts", "SecureContentValidator.sol", "SecureContentValidator.json");
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    
    // Contract address (use the latest deployed address)
    const contractAddress = "0x51Ff6c11163e7da9Bc939808bd27a136b518F2Fc";
    
    // Create contract instance with test wallet
    const contract = new ethers.Contract(contractAddress, artifact.abi, testWallet);
    
    // Test certificate ID (use an existing one)
    const tokenId = 1;
    
    // Create some test content and hash
    const testContent = "Test content for locking mechanism";
    const contentHash = ethers.keccak256(ethers.toUtf8Bytes(testContent));
    
    console.log("Testing with content hash:", contentHash);
    
    // Check initial lock status
    const initialLocked = await contract.isAddressLocked(testWallet.address);
    console.log("Initial lock status:", initialLocked);
    
    // Get initial failed attempts
    const initialFailedAttempts = await contract.getFailedAttempts(testWallet.address);
    console.log("Initial failed attempts:", initialFailedAttempts.toString());
    
    // Perform first failed verification
    console.log("\n--- First failed verification ---");
    try {
      const tx1 = await contract.verifyContent(testContent, ethers.ZeroHash, tokenId); // 使用错误的哈希
      await tx1.wait();
      console.log("First verification completed");
    } catch (error) {
      console.log("First verification failed (expected):", error.message);
    }
    
    // Check failed attempts after first failure
    const failedAttempts1 = await contract.getFailedAttempts(testWallet.address);
    console.log("Failed attempts after first failure:", failedAttempts1.toString());
    
    // Perform second failed verification
    console.log("\n--- Second failed verification ---");
    try {
      const tx2 = await contract.verifyContent(testContent, ethers.ZeroHash, tokenId); // 使用错误的哈希
      await tx2.wait();
      console.log("Second verification completed");
    } catch (error) {
      console.log("Second verification failed (expected):", error.message);
    }
    
    // Check failed attempts after second failure
    const failedAttempts2 = await contract.getFailedAttempts(testWallet.address);
    console.log("Failed attempts after second failure:", failedAttempts2.toString());
    
    // Perform third failed verification
    console.log("\n--- Third failed verification ---");
    try {
      const tx3 = await contract.verifyContent(testContent, ethers.ZeroHash, tokenId); // 使用错误的哈希
      await tx3.wait();
      console.log("Third verification completed");
    } catch (error) {
      console.log("Third verification failed (expected):", error.message);
    }
    
    // Check failed attempts after third failure
    const failedAttempts3 = await contract.getFailedAttempts(testWallet.address);
    console.log("Failed attempts after third failure:", failedAttempts3.toString());
    
    // Check lock status after third failure
    const lockedAfterThird = await contract.isAddressLocked(testWallet.address);
    console.log("Lock status after third failure:", lockedAfterThird);
    
    if (lockedAfterThird) {
      const unlockTime = await contract.getUnlockTime(testWallet.address);
      console.log("Unlock time:", new Date(unlockTime * 1000).toLocaleString());
    }
    
    console.log("\nLocking mechanism test completed!");
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});