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
    
    // Use the deployer wallet for testing (this should be an authorized admin)
    const privateKey = process.env.MONAD_TESTNET_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("MONAD_TESTNET_PRIVATE_KEY not found in .env file");
    }
    
    const wallet = new ethers.Wallet(privateKey.startsWith('0x') ? privateKey : '0x' + privateKey, provider);
    console.log("Test wallet address:", wallet.address);
    
    // Read contract artifacts
    const secureValidatorArtifactPath = path.join(
      process.cwd(), 
      "artifacts", 
      "contracts", 
      "SecureContentValidator.sol", 
      "SecureContentValidator.json"
    );
    
    if (!fs.existsSync(secureValidatorArtifactPath)) {
      throw new Error("SecureContentValidator artifact not found");
    }
    
    const secureValidatorArtifact = JSON.parse(fs.readFileSync(secureValidatorArtifactPath, "utf8"));
    
    // Contract address (read from deployed address file)
    const addressFilePath = path.join(process.cwd(), ".contract-address-secure-validator");
    if (!fs.existsSync(addressFilePath)) {
      throw new Error("Secure validator contract address file not found");
    }
    
    const contractAddress = fs.readFileSync(addressFilePath, "utf8").trim();
    console.log("Secure validator contract address:", contractAddress);
    
    // Create contract instance with test wallet
    const validatorContract = new ethers.Contract(contractAddress, secureValidatorArtifact.abi, wallet);
    
    // Test certificate ID (we'll use 1 for testing)
    const tokenId = 1;
    
    // Create test content and hash
    const testContent = "Test content for locking mechanism verification";
    const contentHash = ethers.keccak256(ethers.toUtf8Bytes(testContent));
    
    console.log("Test content:", testContent);
    console.log("Content hash:", contentHash);
    
    // Check initial lock status
    console.log("\n=== Checking Initial State ===");
    const initialLocked = await validatorContract.isAddressLocked(wallet.address);
    console.log("Initial lock status:", initialLocked);
    
    const initialFailedAttempts = await validatorContract.getFailedAttempts(wallet.address);
    console.log("Initial failed attempts:", initialFailedAttempts.toString());
    
    // Perform first failed verification (wrong hash)
    console.log("\n=== First Failed Verification ===");
    try {
      const tx1 = await validatorContract.verifyContent(testContent, ethers.ZeroHash, tokenId);
      const receipt1 = await tx1.wait();
      console.log("First verification transaction:", receipt1.hash);
    } catch (error) {
      console.log("First verification error (expected):", error.message);
    }
    
    // Check state after first failure
    const failedAttempts1 = await validatorContract.getFailedAttempts(wallet.address);
    console.log("Failed attempts after first failure:", failedAttempts1.toString());
    
    // Perform second failed verification
    console.log("\n=== Second Failed Verification ===");
    try {
      const tx2 = await validatorContract.verifyContent(testContent, ethers.ZeroHash, tokenId);
      const receipt2 = await tx2.wait();
      console.log("Second verification transaction:", receipt2.hash);
    } catch (error) {
      console.log("Second verification error (expected):", error.message);
    }
    
    // Check state after second failure
    const failedAttempts2 = await validatorContract.getFailedAttempts(wallet.address);
    console.log("Failed attempts after second failure:", failedAttempts2.toString());
    
    // Perform third failed verification (should trigger lock)
    console.log("\n=== Third Failed Verification (Should Trigger Lock) ===");
    try {
      const tx3 = await validatorContract.verifyContent(testContent, ethers.ZeroHash, tokenId);
      const receipt3 = await tx3.wait();
      console.log("Third verification transaction:", receipt3.hash);
    } catch (error) {
      console.log("Third verification error (expected):", error.message);
    }
    
    // Check state after third failure
    const failedAttempts3 = await validatorContract.getFailedAttempts(wallet.address);
    console.log("Failed attempts after third failure:", failedAttempts3.toString());
    
    // Check if address is now locked
    const lockedAfterThird = await validatorContract.isAddressLocked(wallet.address);
    console.log("Lock status after third failure:", lockedAfterThird);
    
    if (lockedAfterThird) {
      const unlockTime = await validatorContract.getUnlockTime(wallet.address);
      console.log("Unlock time:", new Date(unlockTime * 1000).toLocaleString());
    }
    
    // Try to perform another verification while locked
    console.log("\n=== Verification Attempt While Locked ===");
    try {
      const tx4 = await validatorContract.verifyContent(testContent, ethers.ZeroHash, tokenId);
      const receipt4 = await tx4.wait();
      console.log("Fourth verification transaction:", receipt4.hash);
    } catch (error) {
      console.log("Fourth verification error (expected while locked):", error.message);
    }
    
    console.log("\n=== Locking Mechanism Test Completed ===");
    console.log("Summary:");
    console.log("- Initial failed attempts:", initialFailedAttempts.toString());
    console.log("- Final failed attempts:", failedAttempts3.toString());
    console.log("- Final lock status:", lockedAfterThird);
    
  } catch (error) {
    console.error("Error:", error.message);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});