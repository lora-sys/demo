import React, { useState } from 'react';
import { ethers } from 'ethers';
import contractConfig from './contracts/LearningCredential.json';
import secureValidatorConfig from './contracts/SecureContentValidator.json';

const CertificatePage = () => {
  // Minting state
  const [formData, setFormData] = useState({
    studentName: '',
    courseName: '',
    issuer: '',
    date: ''
  });
  
  const [account, setAccount] = useState('');
  const [minting, setMinting] = useState(false);
  const [mintMessage, setMintMessage] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [tokenId, setTokenId] = useState('');

  // Verification state
  const [txHash, setTxHash] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifyError, setVerifyError] = useState('');

  // Revocation state
  const [revoking, setRevoking] = useState(false);

  // Secure validation state
  const [content, setContent] = useState('');
  const [contentHash, setContentHash] = useState('');
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [lockedStatus, setLockedStatus] = useState(null);
  const [verificationLogs, setVerificationLogs] = useState([]);

  // Contract ABI and address from configuration
  const contractABI = contractConfig.abi;
  const contractAddress = contractConfig.address;

  // Handle form input changes for minting
  const handleMintInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Connect wallet for minting
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        setMintMessage('Wallet connected successfully!');
      } catch (error) {
        setMintMessage('Failed to connect wallet: ' + error.message);
      }
    } else {
      setMintMessage('Please install MetaMask to use this feature.');
    }
  };

  // Mint certificate NFT
  const mintCertificate = async () => {
    if (!account) {
      setMintMessage('Please connect your wallet first.');
      return;
    }

    setMinting(true);
    setMintMessage('');
    setTransactionHash('');
    setTokenId('');

    try {
      // Check if we're on Monad Testnet (chainId 10143 in decimal, 0x279f in hex)
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log("Current chainId:", chainId);
      console.log("Expected chainId:", '0x279f');
      console.log("ChainId match:", chainId.toLowerCase() === '0x279f');
      
      // Also check with ethers.js
      const testProvider = new ethers.BrowserProvider(window.ethereum);
      const network = await testProvider.getNetwork();
      console.log("Ethers.js chainId:", network.chainId.toString(16));
      
      if (chainId.toLowerCase() !== '0x279f') { // Monad Testnet chain ID (10143 in decimal)
        setMintMessage(`Please switch to the Monad Testnet network in your MetaMask wallet. Current chainId: ${chainId} (${parseInt(chainId, 16)})`);
        setMinting(false);
        return;
      }

      // Create the metadata string
      const metadata = `姓名:${formData.studentName}, 课程:${formData.courseName}, 机构:${formData.issuer}, 日期:${formData.date}`;

      // Initialize ethers provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Create contract instance
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      // Call the safeMint function
      const transaction = await contract.safeMint(account, metadata);
      
      // Wait for transaction to be mined
      const receipt = await transaction.wait();
      console.log('Transaction receipt:', receipt);
      console.log('Logs:', receipt.logs);
      
      // Extract token ID from the event (assuming standard ERC721 event)
      const transferTopic = ethers.id("Transfer(address,address,uint256)");
      console.log('Expected Transfer topic:', transferTopic);
      
      const transferLog = receipt.logs.find(log => log.topics[0] === transferTopic);
      console.log('Transfer log found:', transferLog);
      
      const tokenId = transferLog ? ethers.toBigInt(transferLog.topics[3]).toString() : 'Unknown';
      console.log('Extracted Token ID:', tokenId);
      
      // Set success state
      setTransactionHash(receipt.hash);
      setTokenId(tokenId);
      setMintMessage('Certificate minted successfully!');
    } catch (error) {
      console.error('Minting error:', error);
      setMintMessage('Error minting certificate: ' + error.message);
    } finally {
      setMinting(false);
    }
  };

  // Verify certificate
  const verifyCertificate = async () => {
    if (!txHash) {
      setVerifyError('请输入交易哈希');
      return;
    }

    setVerifying(true);
    setVerifyError('');
    setVerificationResult(null);

    try {
      // Initialize ethers provider for Monad Testnet
      const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz/');

      // Get transaction receipt
      const receipt = await provider.getTransactionReceipt(txHash);
      console.log('Verification receipt:', receipt);
      
      if (!receipt) {
        throw new Error('未找到交易，请检查交易哈希是否正确');
      }

      if (!receipt.status) {
        throw new Error('交易执行失败');
      }

      // Find the Transfer event to get tokenId
      const transferTopic = ethers.id("Transfer(address,address,uint256)");
      console.log('Expected Transfer topic:', transferTopic);
      
      const transferLog = receipt.logs.find(log => log.topics[0] === transferTopic);
      console.log('Transfer log found in verification:', transferLog);
      
      if (!transferLog) {
        throw new Error('未在交易中找到NFT铸造事件');
      }

      // Parse tokenId from log data
      const tokenId = ethers.toBigInt(transferLog.topics[3]).toString();
      console.log('Verified Token ID:', tokenId);

      // Create contract instance
      const contract = new ethers.Contract(contractAddress, contractABI, provider);

      // Get metadata from contract
      const metadata = await contract.getMetadata(tokenId);
      
      // Get certificate status
      const status = await contract.certificateStatus(tokenId);
      const isRevoked = status === '已撤销';

      // Parse metadata string
      const parsedData = {};
      const pairs = metadata.split(', ');
      pairs.forEach(pair => {
        const [key, value] = pair.split(':');
        if (key && value) {
          parsedData[key.trim()] = value.trim();
        }
      });

      // Set verification result
      setVerificationResult({
        tokenId,
        metadata: parsedData,
        txHash,
        isRevoked
      });
    } catch (err) {
      console.error('Verification error:', err);
      setVerifyError(err.message || '验证过程中发生错误');
    } finally {
      setVerifying(false);
    }
  };

  // Revoke certificate
  const revokeCertificate = async (tokenId) => {
    if (!account) {
      setVerifyError('请先连接钱包');
      return;
    }

    setRevoking(true);
    setVerifyError('');

    try {
      // Initialize ethers provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Create contract instance
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      // Call the revokeCertificate function
      const transaction = await contract.revokeCertificate(tokenId);
      
      // Wait for transaction to be mined
      const receipt = await transaction.wait();
      
      // Update verification result to show revoked status
      if (verificationResult) {
        setVerificationResult({
          ...verificationResult,
          isRevoked: true
        });
      }
      
      setVerifyError('证书已成功撤销！');
    } catch (error) {
      console.error('Revocation error:', error);
      setVerifyError('撤销证书时出错: ' + error.message);
    } finally {
      setRevoking(false);
    }
  };

  // Secure content validation
  const validateContent = async () => {
    if (!content || !contentHash) {
      setValidationError('请输入内容和哈希值');
      return;
    }

    if (!account) {
      setValidationError('请先连接钱包');
      return;
    }

    setValidating(true);
    setValidationError('');

    try {
      // Check if address is locked
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Create secure validator contract instance
      const validatorContract = new ethers.Contract(
        secureValidatorConfig.address,
        secureValidatorConfig.abi,
        signer
      );

      // Check if address is locked before validation
      const isLocked = await validatorContract.isAddressLocked(account);
      if (isLocked) {
        const unlockTime = await validatorContract.getUnlockTime(account);
        setValidationError(`地址已被锁定，解锁时间: ${new Date(unlockTime * 1000).toLocaleString()}`);
        return;
      }

      // Call the verifyContent function
      const tx = await validatorContract.verifyContent(content, contentHash);
      const receipt = await tx.wait();
      
      // Parse event logs to get validation result
      const contentVerifiedEvent = receipt.logs.find(log => {
        try {
          const parsedLog = validatorContract.interface.parseLog(log);
          return parsedLog.name === 'ContentVerified';
        } catch (e) {
          return false;
        }
      });

      if (contentVerifiedEvent) {
        const { args } = contentVerifiedEvent;
        const isValid = args.isValid;
        
        setValidationResult({
          contentHash: args.contentHash,
          isValid: isValid,
          timestamp: new Date().toLocaleString()
        });

        if (!isValid) {
          // Get failed attempts count
          const failedAttempts = await validatorContract.getFailedAttempts(account);
          setValidationError(`验证失败，失败次数: ${failedAttempts}`);
          
          // Check if address is now locked
          const nowLocked = await validatorContract.isAddressLocked(account);
          if (nowLocked) {
            const unlockTime = await validatorContract.getUnlockTime(account);
            setValidationError(prev => prev + ` 地址已被锁定，解锁时间: ${new Date(unlockTime * 1000).toLocaleString()}`);
          }
        } else {
          setValidationError('验证成功！');
        }
      }
    } catch (error) {
      console.error('Validation error:', error);
      setValidationError('验证过程中出错: ' + error.message);
    } finally {
      setValidating(false);
    }
  };

  // Fetch verification logs
  const fetchVerificationLogs = async () => {
    try {
      console.log("Fetching verification logs...");
      
      // Create provider for Monad Testnet
      const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz/');
      
      // Create secure validator contract instance
      const validatorContract = new ethers.Contract(
        secureValidatorConfig.address,
        secureValidatorConfig.abi,
        provider
      );

      // Get logs count
      const logsCount = await validatorContract.getVerificationLogsCount();
      console.log("Logs count:", logsCount.toString());
      
      if (logsCount > 0) {
        // Fetch logs (up to 10 most recent)
        const startIndex = logsCount > 10 ? Number(logsCount) - 10 : 0;
        const count = logsCount > 10 ? 10 : Number(logsCount);
        
        console.log("Fetching logs from index", startIndex, "count", count);
        
        const logs = await validatorContract.getVerificationLogs(startIndex, count);
        console.log("Raw logs:", logs);
        
        // Format logs for display
        const formattedLogs = [];
        
        // Handle the logs array - each log is a Result object that needs to be accessed correctly
        for (let i = 0; i < logs.length; i++) {
          const log = logs[i];
          console.log(`Processing log ${i}:`, log);
          
          // The log is a Result object with indexed properties
          const formattedLog = {
            user: log[0] || log.user || 'N/A',
            tokenId: (log[1] || log.tokenId || 'N/A').toString(),
            contentHash: log[2] || log.contentHash || 'N/A',
            isValid: Boolean(log[3] !== undefined ? log[3] : log.isValid),
            timestamp: (log[4] || log.timestamp || Date.now()).toString()
          };
          
          console.log(`Formatted log ${i}:`, formattedLog);
          formattedLogs.push(formattedLog);
        }
        
        console.log("Setting verification logs:", formattedLogs);
        setVerificationLogs(formattedLogs);
      } else {
        console.log("No logs found, setting empty array");
        setVerificationLogs([]);
      }
    } catch (error) {
      console.error('Error fetching verification logs:', error);
      // Even on error, set to empty array to prevent UI issues
      setVerificationLogs([]);
    }
  };

  // Check address lock status
  const checkLockStatus = async () => {
    if (!account) return;

    try {
      // Create provider for Monad Testnet
      const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz/', 10143);
      
      // Create secure validator contract instance
      const validatorContract = new ethers.Contract(
        secureValidatorConfig.address,
        secureValidatorConfig.abi,
        provider
      );

      // Check if address is locked
      const isLocked = await validatorContract.isAddressLocked(account);
      if (isLocked) {
        const unlockTime = await validatorContract.getUnlockTime(account);
        setLockedStatus({
          isLocked: true,
          unlockTime: new Date(unlockTime * 1000).toLocaleString()
        });
      } else {
        setLockedStatus({
          isLocked: false,
          unlockTime: null
        });
      }
    } catch (error) {
      console.error('Error checking lock status:', error);
    }
  };

  // Validate certificate content integrity
  const validateCertificateContent = async () => {
    if (!tokenId) {
      setValidationError('请输入证书Token ID');
      return;
    }

    if (!account) {
      setValidationError('请先连接钱包');
      return;
    }

    setValidating(true);
    setValidationError('');

    try {
      // Check if address is locked
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Create secure validator contract instance
      const validatorContract = new ethers.Contract(
        secureValidatorConfig.address,
        secureValidatorConfig.abi,
        signer
      );

      // Check if address is locked before validation
      const isLocked = await validatorContract.isAddressLocked(account);
      if (isLocked) {
        const unlockTime = await validatorContract.getUnlockTime(account);
        setValidationError(`地址已被锁定，解锁时间: ${new Date(unlockTime * 1000).toLocaleString()}`);
        setValidating(false);
        return;
      }

      // Create learning credential contract instance to get certificate metadata
      const credentialContract = new ethers.Contract(
        contractConfig.address,
        contractConfig.abi,
        provider
      );

      // Get certificate metadata
      const metadata = await credentialContract.getMetadata(tokenId);
      console.log("Certificate metadata:", metadata);
      
      // Parse metadata - handle encoding issues more carefully
      let parsedData = {};
      try {
        // Try to parse the metadata directly first
        const pairs = metadata.split(', ');
        pairs.forEach(pair => {
          const [key, value] = pair.split(':');
          if (key && value) {
            parsedData[key.trim()] = value.trim();
          }
        });
      } catch (parseError) {
        console.error("Error parsing metadata:", parseError);
        // If parsing fails, try a more robust approach
        const parts = metadata.match(/([^,]+:[^,]+)/g) || [];
        parts.forEach(part => {
          const [key, value] = part.split(':');
          if (key && value) {
            parsedData[key.trim()] = value.trim();
          }
        });
      }
      
      console.log("Parsed metadata:", parsedData);

      // Recreate the standardized content
      const standardizedContent = `姓名:${parsedData['姓名']}, 课程:${parsedData['课程']}, 机构:${parsedData['机构']}, 日期:${parsedData['日期']}`;
      console.log("Standardized content:", standardizedContent);
      
      // Calculate content hash
      const contentHash = ethers.keccak256(ethers.toUtf8Bytes(standardizedContent));
      console.log("Content hash:", contentHash);
      
      // Call the verifyContent function with tokenId
      console.log("Calling verifyContent with:", {
        content: standardizedContent,
        hash: contentHash,
        tokenId: tokenId
      });
      
      const tx = await validatorContract.verifyContent(standardizedContent, contentHash, tokenId);
      console.log("Transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Transaction receipt:", receipt);
      
      // Parse event logs to get validation result
      const contentVerifiedEvent = receipt.logs.find(log => {
        try {
          const parsedLog = validatorContract.interface.parseLog(log);
          return parsedLog.name === 'ContentVerified';
        } catch (e) {
          return false;
        }
      });

      if (contentVerifiedEvent) {
        const { args } = contentVerifiedEvent;
        const isValid = args.isValid;
        console.log("Validation result:", { isValid, args });
        
        setValidationResult({
          tokenId: tokenId,
          metadata: parsedData,
          contentHash: args.contentHash,
          isValid: isValid,
          timestamp: new Date().toLocaleString()
        });

        if (!isValid) {
          // Get failed attempts count
          const failedAttempts = await validatorContract.getFailedAttempts(account);
          setValidationError(`验证失败，失败次数: ${failedAttempts}`);
          
          // Check if address is now locked
          const nowLocked = await validatorContract.isAddressLocked(account);
          if (nowLocked) {
            const unlockTime = await validatorContract.getUnlockTime(account);
            setValidationError(prev => prev + ` 地址已被锁定，解锁时间: ${new Date(unlockTime * 1000).toLocaleString()}`);
          }
        } else {
          setValidationError('证书内容完整性验证成功！');
        }
      }
    } catch (error) {
      console.error('Validation error:', error);
      setValidationError('验证过程中出错: ' + error.message);
    } finally {
      setValidating(false);
    }
  };

  return (
    <div style={{ 
      backgroundColor: '#f5f5f5', 
      minHeight: '100vh', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          color: '#333',
          marginBottom: '10px',
          fontSize: '32px'
        }}>
          区块链证书系统
        </h1>
        <p style={{ 
          textAlign: 'center', 
          color: '#666',
          marginBottom: '30px',
          fontSize: '16px'
        }}>
          基于Monad测试网的NFT证书发行与验证
        </p>
        
        <div style={{ 
          display: 'flex',
          gap: '30px',
          flexWrap: 'nowrap'
        }}>
          {/* Minting Section */}
          <div style={{ 
            flex: '1',
            minWidth: '0', // 防止内容溢出
            border: '1px solid #ddd',
            borderRadius: '6px',
            padding: '25px'
          }}>
            <h2 style={{ 
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '20px',
              paddingBottom: '10px',
              borderBottom: '1px solid #eee'
            }}>
              🎓 证书发行
            </h2>
            
            {!account ? (
              <button 
                onClick={connectWallet}
                style={{
                  width: '100%',
                  backgroundColor: '#4f46e5',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  fontSize: '16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginBottom: '20px'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#4338ca'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#4f46e5'}
              >
                连接钱包
              </button>
            ) : (
              <div style={{
                marginBottom: '20px',
                padding: '10px',
                backgroundColor: '#dcfce7',
                border: '1px solid #bbf7d0',
                borderRadius: '4px'
              }}>
                <p style={{ 
                  fontSize: '14px',
                  color: '#166534',
                  margin: 0
                }}>
                  已连接: {account.substring(0, 6)}...{account.substring(account.length - 4)}
                </p>
              </div>
            )}
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '5px',
                fontWeight: '500',
                color: '#333'
              }}>
                学员姓名
              </label>
              <input
                type="text"
                name="studentName"
                value={formData.studentName}
                onChange={handleMintInputChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                placeholder="输入学员姓名"
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '5px',
                fontWeight: '500',
                color: '#333'
              }}>
                课程名称
              </label>
              <input
                type="text"
                name="courseName"
                value={formData.courseName}
                onChange={handleMintInputChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                placeholder="输入课程名称"
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '5px',
                fontWeight: '500',
                color: '#333'
              }}>
                颁发机构
              </label>
              <input
                type="text"
                name="issuer"
                value={formData.issuer}
                onChange={handleMintInputChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                placeholder="输入颁发机构"
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '5px',
                fontWeight: '500',
                color: '#333'
              }}>
                日期
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleMintInputChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <button 
              onClick={mintCertificate} 
              disabled={minting}
              style={{
                width: '100%',
                backgroundColor: minting ? '#9ca3af' : '#16a34a',
                color: 'white',
                border: 'none',
                padding: '12px',
                fontSize: '16px',
                borderRadius: '4px',
                cursor: minting ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
              onMouseOver={(e) => {
                if (!minting) e.target.style.backgroundColor = '#15803d';
              }}
              onMouseOut={(e) => {
                if (!minting) e.target.style.backgroundColor = '#16a34a';
              }}
            >
              {minting ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #ffffff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginRight: '8px'
                  }}></div>
                  铸造中...
                </div>
              ) : (
                '生成证书并上链'
              )}
            </button>
            
            {mintMessage && (
              <div style={{
                marginTop: '25px',
                padding: '25px',
                borderRadius: '6px',
                backgroundColor: mintMessage.includes('Error') || mintMessage.includes('Failed') 
                  ? '#fee2e2' 
                  : '#dcfce7',
                border: `1px solid ${mintMessage.includes('Error') || mintMessage.includes('Failed') 
                  ? '#fecaca' 
                  : '#bbf7d0'}`,
                color: mintMessage.includes('Error') || mintMessage.includes('Failed') 
                  ? '#b91c1c' 
                  : '#166534'
              }}>
                <p style={{ 
                  margin: '0 0 15px 0', 
                  fontWeight: '600',
                  fontSize: '18px'
                }}>{mintMessage}</p>
                {transactionHash && (
                  <p style={{ margin: '10px 0', fontSize: '16px' }}>
                    交易哈希: <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>{transactionHash}</span>
                  </p>
                )}
                {tokenId && tokenId !== 'Unknown' && (
                  <p style={{ margin: '15px 0 0 0', fontSize: '16px' }}>
                    Token ID: <span style={{ fontWeight: 'bold', fontSize: '20px' }}>{tokenId}</span>
                  </p>
                )}
              </div>
            )}
          </div>
          
          {/* Verification Section */}
          <div style={{ 
            flex: '1',
            minWidth: '0', // 防止内容溢出
            border: '1px solid #ddd',
            borderRadius: '6px',
            padding: '25px'
          }}>
            <h2 style={{ 
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '20px',
              paddingBottom: '10px',
              borderBottom: '1px solid #eee'
            }}>
              🔍 证书验证
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '5px',
                fontWeight: '500',
                color: '#333'
              }}>
                交易哈希
              </label>
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                placeholder="输入交易哈希"
              />
            </div>
            
            <button 
              onClick={verifyCertificate} 
              disabled={verifying}
              style={{
                width: '100%',
                backgroundColor: verifying ? '#9ca3af' : '#2563eb',
                color: 'white',
                border: 'none',
                padding: '12px',
                fontSize: '16px',
                borderRadius: '4px',
                cursor: verifying ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
              onMouseOver={(e) => {
                if (!verifying) e.target.style.backgroundColor = '#1d4ed8';
              }}
              onMouseOut={(e) => {
                if (!verifying) e.target.style.backgroundColor = '#2563eb';
              }}
            >
              {verifying ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #ffffff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginRight: '8px'
                  }}></div>
                  验证中...
                </div>
              ) : (
                '验证证书'
              )}
            </button>

            {verifyError && (
              <div style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '4px',
                color: '#b91c1c'
              }}>
                <p style={{ margin: 0 }}>{verifyError}</p>
              </div>
            )}

            {verificationResult && (
              <div style={{
                marginTop: '25px',
                padding: '25px',
                backgroundColor: '#dcfce7',
                border: '1px solid #bbf7d0',
                borderRadius: '6px',
                color: '#166534'
              }}>
                <h3 style={{ 
                  fontSize: '20px',
                  fontWeight: 'bold',
                  margin: '0 0 20px 0',
                  color: '#15803d',
                  textAlign: 'center'
                }}>
                  ✅ 验证成功！
                </h3>
                
                <div style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '6px',
                  marginBottom: '20px'
                }}>
                  <h4 style={{ 
                    fontWeight: 'bold',
                    color: '#333',
                    margin: '0 0 15px 0',
                    fontSize: '18px'
                  }}>
                    证书信息:
                  </h4>
                  <div style={{ 
                    marginBottom: '12px',
                    padding: '10px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '4px'
                  }}>
                    <span style={{ fontWeight: '600' }}>Token ID:</span>
                    <span style={{ marginLeft: '15px', fontSize: '18px', fontWeight: 'bold' }}>#{verificationResult.tokenId}</span>
                  </div>
                  {Object.entries(verificationResult.metadata).map(([key, value]) => (
                    <div key={key} style={{ 
                      marginBottom: '12px',
                      padding: '10px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '4px'
                    }}>
                      <span style={{ fontWeight: '600' }}>{key}:</span>
                      <span style={{ marginLeft: '15px' }}>{value}</span>
                    </div>
                  ))}
                </div>
                
                <div style={{
                  textAlign: 'center',
                  padding: '20px',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  marginBottom: '20px'
                }}>
                  <p style={{ 
                    fontWeight: 'bold',
                    color: '#333',
                    margin: '0 0 15px 0',
                    fontSize: '16px'
                  }}>
                    🔒 该记录已通过区块链验证，不可篡改
                  </p>
                  <div style={{ 
                    marginTop: '15px',
                    padding: '15px',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '6px',
                    border: '1px solid #bae6fd'
                  }}>
                    <p style={{ 
                      margin: '0 0 10px 0', 
                      fontWeight: '600',
                      color: '#0369a1'
                    }}>
                      证书状态: <span style={{ 
                        color: verificationResult.isRevoked ? '#dc2626' : '#16a34a',
                        fontWeight: 'bold'
                      }}>
                        {verificationResult.isRevoked ? '已撤销' : '有效'}
                      </span>
                    </p>
                    {account && account.toLowerCase() === contractConfig.address.toLowerCase() && (
                      <button
                        onClick={() => revokeCertificate(verificationResult.tokenId)}
                        disabled={revoking}
                        style={{
                          backgroundColor: revoking ? '#9ca3af' : '#dc2626',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          cursor: revoking ? 'not-allowed' : 'pointer',
                          fontWeight: '500',
                          fontSize: '14px'
                        }}
                      >
                        {revoking ? '撤销中...' : '撤销证书'}
                      </button>
                    )}
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <a 
                    href={`https://testnet.monadexplorer.com/tx/${verificationResult.txHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      color: '#2563eb',
                      textDecoration: 'underline',
                      fontSize: '16px'
                    }}
                  >
                    在Monad测试网浏览器上查看交易详情
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Secure Validation Section */}
        <div style={{ 
          marginTop: '30px',
          border: '1px solid #ddd',
          borderRadius: '6px',
          padding: '25px'
        }}>
          <h2 style={{ 
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '20px',
            paddingBottom: '10px',
            borderBottom: '1px solid #eee'
          }}>
            🔐 安全内容验证
          </h2>
          
          <div style={{ 
            display: 'flex',
            gap: '30px',
            flexWrap: 'nowrap'
          }}>
            {/* Validation Form */}
            <div style={{ 
              flex: '1',
              minWidth: '0',
              border: '1px solid #ddd',
              borderRadius: '6px',
              padding: '25px'
            }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: '500',
                  color: '#333'
                }}>
                  选择要验证的证书Token ID
                </label>
                <input
                  type="text"
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  placeholder="输入证书Token ID"
                />
              </div>
              
              <button 
                onClick={validateCertificateContent} 
                disabled={validating}
                style={{
                  width: '100%',
                  backgroundColor: validating ? '#9ca3af' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  fontSize: '16px',
                  borderRadius: '4px',
                  cursor: validating ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {validating ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #ffffff',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginRight: '8px'
                    }}></div>
                    验证中...
                  </div>
                ) : (
                  '验证证书内容完整性'
                )}
              </button>

              {validationError && (
                <div style={{
                  marginTop: '20px',
                  padding: '15px',
                  backgroundColor: validationError.includes('成功') ? '#dcfce7' : '#fee2e2',
                  border: `1px solid ${validationError.includes('成功') ? '#bbf7d0' : '#fecaca'}`,
                  borderRadius: '4px',
                  color: validationError.includes('成功') ? '#166534' : '#b91c1c'
                }}>
                  <p style={{ margin: 0 }}>{validationError}</p>
                </div>
              )}

              {validationResult && (
                <div style={{
                  marginTop: '25px',
                  padding: '25px',
                  backgroundColor: validationResult.isValid ? '#dcfce7' : '#fee2e2',
                  border: `1px solid ${validationResult.isValid ? '#bbf7d0' : '#fecaca'}`,
                  borderRadius: '6px',
                  color: validationResult.isValid ? '#166534' : '#b91c1c'
                }}>
                  <h3 style={{ 
                    fontSize: '20px',
                    fontWeight: 'bold',
                    margin: '0 0 20px 0',
                    color: validationResult.isValid ? '#15803d' : '#991b1b',
                    textAlign: 'center'
                  }}>
                    {validationResult.isValid ? '✅ 验证成功！' : '❌ 验证失败！'}
                  </h3>
                  
                  <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '6px'
                  }}>
                    <div style={{ 
                      marginBottom: '12px',
                      padding: '10px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '4px'
                    }}>
                      <span style={{ fontWeight: '600' }}>Token ID:</span>
                      <span style={{ marginLeft: '15px', fontSize: '18px', fontWeight: 'bold' }}>
                        #{validationResult.tokenId}
                      </span>
                    </div>
                    
                    <div style={{ 
                      marginBottom: '12px',
                      padding: '10px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '4px'
                    }}>
                      <span style={{ fontWeight: '600' }}>证书信息:</span>
                      <div style={{ marginLeft: '15px', marginTop: '8px' }}>
                        {Object.entries(validationResult.metadata).map(([key, value]) => (
                          <div key={key} style={{ marginBottom: '5px' }}>
                            <span style={{ fontWeight: '500' }}>{key}:</span>
                            <span style={{ marginLeft: '10px' }}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div style={{ 
                      marginBottom: '12px',
                      padding: '10px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '4px'
                    }}>
                      <span style={{ fontWeight: '600' }}>内容哈希:</span>
                      <span style={{ marginLeft: '15px', fontFamily: 'monospace', fontSize: '14px' }}>
                        {validationResult.contentHash.substring(0, 20)}...{validationResult.contentHash.substring(56)}
                      </span>
                    </div>
                    
                    <div style={{ 
                      marginBottom: '12px',
                      padding: '10px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '4px'
                    }}>
                      <span style={{ fontWeight: '600' }}>验证时间:</span>
                      <span style={{ marginLeft: '15px' }}>{validationResult.timestamp}</span>
                    </div>
                    
                    <div style={{ 
                      marginBottom: '12px',
                      padding: '10px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '4px'
                    }}>
                      <span style={{ fontWeight: '600' }}>验证结果:</span>
                      <span style={{ 
                        marginLeft: '15px', 
                        color: validationResult.isValid ? '#16a34a' : '#dc2626',
                        fontWeight: 'bold'
                      }}>
                        {validationResult.isValid ? '内容完整且未被篡改' : '内容可能已被篡改'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Lock Status */}
              {lockedStatus && (
                <div style={{
                  marginTop: '25px',
                  padding: '25px',
                  backgroundColor: lockedStatus.isLocked ? '#fee2e2' : '#dcfce7',
                  border: `1px solid ${lockedStatus.isLocked ? '#fecaca' : '#bbf7d0'}`,
                  borderRadius: '6px',
                  color: lockedStatus.isLocked ? '#b91c1c' : '#166534'
                }}>
                  <h3 style={{ 
                    fontSize: '20px',
                    fontWeight: 'bold',
                    margin: '0 0 20px 0',
                    color: lockedStatus.isLocked ? '#991b1b' : '#15803d',
                    textAlign: 'center'
                  }}>
                    {lockedStatus.isLocked ? '🔒 地址已被锁定' : '🔓 地址未被锁定'}
                  </h3>
                  
                  {lockedStatus.isLocked && (
                    <div style={{
                      backgroundColor: 'white',
                      padding: '20px',
                      borderRadius: '6px'
                    }}>
                      <div style={{ 
                        marginBottom: '12px',
                        padding: '10px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '4px'
                      }}>
                        <span style={{ fontWeight: '600' }}>解锁时间:</span>
                        <span style={{ marginLeft: '15px' }}>{lockedStatus.unlockTime}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Verification Logs */}
            <div style={{ 
              flex: '1',
              minWidth: '0',
              border: '1px solid #ddd',
              borderRadius: '6px',
              padding: '25px'
            }}>
              <h3 style={{ 
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#333',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                📋 验证日志
              </h3>
              
              <button 
                onClick={fetchVerificationLogs}
                style={{
                  width: '100%',
                  backgroundColor: '#4f46e5',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  fontSize: '16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  marginBottom: '20px'
                }}
              >
                刷新日志
              </button>
              
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {verificationLogs.length > 0 ? (
                  verificationLogs.map((log, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        marginBottom: '15px',
                        padding: '15px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '4px',
                        borderLeft: `4px solid ${log.isValid ? '#16a34a' : '#dc2626'}`
                      }}
                    >
                      <div style={{ 
                        marginBottom: '8px',
                        fontSize: '14px'
                      }}>
                        <span style={{ fontWeight: '600' }}>地址:</span>
                        <span style={{ marginLeft: '10px', fontFamily: 'monospace' }}>
                          {log.user ? log.user.substring(0, 6) + '...' + log.user.substring(log.user.length - 4) : 'N/A'}
                        </span>
                      </div>
                      
                      <div style={{ 
                        marginBottom: '8px',
                        fontSize: '14px'
                      }}>
                        <span style={{ fontWeight: '600' }}>Token ID:</span>
                        <span style={{ marginLeft: '10px' }}>
                          #{log.tokenId || 'N/A'}
                        </span>
                      </div>
                      
                      <div style={{ 
                        marginBottom: '8px',
                        fontSize: '14px'
                      }}>
                        <span style={{ fontWeight: '600' }}>结果:</span>
                        <span style={{ 
                          marginLeft: '10px',
                          color: log.isValid ? '#16a34a' : '#dc2626',
                          fontWeight: 'bold'
                        }}>
                          {log.isValid !== undefined ? (log.isValid ? '有效' : '无效') : 'N/A'}
                        </span>
                      </div>
                      
                      <div style={{ 
                        fontSize: '14px'
                      }}>
                        <span style={{ fontWeight: '600' }}>时间:</span>
                        <span style={{ marginLeft: '10px' }}>
                          {log.timestamp ? new Date(log.timestamp * 1000).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ 
                    textAlign: 'center', 
                    color: '#666',
                    fontStyle: 'italic'
                  }}>
                    暂无验证日志
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          marginTop: '30px',
          textAlign: 'center',
          color: '#666',
          fontSize: '14px'
        }}>
          <p>基于区块链技术的数字证书系统 - 确保学历和证书的真实性与不可篡改性</p>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CertificatePage;