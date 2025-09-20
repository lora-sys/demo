import React, { useState } from 'react';

const CertificateVerifier = () => {
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');

  // Contract ABI - needs to be replaced with actual ABI
  const contractABI = [
    // Replace with your contract's ABI
    "function getMetadata(uint256 tokenId) public view returns (string memory)"
  ];

  // Contract address - replace with your actual contract address
  const contractAddress = "0xYourContractAddress...";

  const verifyCertificate = async () => {
    if (!txHash) {
      setError('请输入交易哈希');
      return;
    }

    setLoading(true);
    setError('');
    setVerificationResult(null);

    try {
      // Initialize ethers provider for Sepolia
      const provider = new ethers.providers.InfuraProvider('sepolia', 'YOUR_INFURA_PROJECT_ID');
      
      // Alternative: Use Alchemy provider
      // const provider = new ethers.providers.AlchemyProvider('sepolia', 'YOUR_ALCHEMY_API_KEY');

      // Get transaction receipt
      const receipt = await provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        throw new Error('未找到交易，请检查交易哈希是否正确');
      }

      if (!receipt.status) {
        throw new Error('交易执行失败');
      }

      // Find the Transfer event to get tokenId
      const transferTopic = ethers.utils.id("Transfer(address,address,uint256)");
      const transferLog = receipt.logs.find(log => log.topics[0] === transferTopic);
      
      if (!transferLog) {
        throw new Error('未在交易中找到NFT铸造事件');
      }

      // Parse tokenId from log data
      const tokenId = ethers.BigNumber.from(transferLog.topics[3]).toString();

      // Create contract instance
      const contract = new ethers.Contract(contractAddress, contractABI, provider);

      // Get metadata from contract
      const metadata = await contract.getMetadata(tokenId);

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
        txHash
      });
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.message || '验证过程中发生错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>证书验证</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label>交易哈希:</label>
        <input
          type="text"
          value={txHash}
          onChange={(e) => setTxHash(e.target.value)}
          placeholder="请输入交易哈希"
          style={{ width: '100%', padding: '10px', marginTop: '5px', marginBottom: '10px' }}
        />
        <button 
          onClick={verifyCertificate} 
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '12px', 
            backgroundColor: '#2196F3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '验证中...' : '验证'}
        </button>
      </div>

      {error && (
        <div style={{ 
          padding: '15px', 
          borderRadius: '4px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          marginBottom: '20px'
        }}>
          <p>{error}</p>
        </div>
      )}

      {verificationResult && (
        <div style={{ 
          padding: '20px', 
          borderRadius: '4px',
          backgroundColor: '#e8f5e9',
          color: '#2e7d32',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginTop: 0, color: '#2e7d32' }}>验证成功！</h3>
          
          <div style={{ 
            padding: '15px', 
            backgroundColor: 'white', 
            borderRadius: '4px',
            marginBottom: '15px'
          }}>
            <h4>证书信息:</h4>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              <li style={{ marginBottom: '8px' }}><strong>Token ID:</strong> {verificationResult.tokenId}</li>
              {Object.entries(verificationResult.metadata).map(([key, value]) => (
                <li key={key} style={{ marginBottom: '8px' }}>
                  <strong>{key}:</strong> {value}
                </li>
              ))}
            </ul>
          </div>
          
          <p style={{ 
            textAlign: 'center', 
            fontWeight: 'bold', 
            fontSize: '1.1em',
            padding: '10px',
            backgroundColor: '#fff',
            borderRadius: '4px'
          }}>
            该记录已通过区块链验证，不可篡改
          </p>
          
          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <a 
              href={`https://sepolia.etherscan.io/tx/${verificationResult.txHash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                color: '#1976D2', 
                textDecoration: 'none',
                fontWeight: 'bold'
              }}
            >
              在Etherscan上查看交易详情
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateVerifier;