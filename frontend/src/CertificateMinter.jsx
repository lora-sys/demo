import React, { useState } from 'react';

const CertificateMinter = () => {
  const [formData, setFormData] = useState({
    studentName: '',
    courseName: '',
    issuer: '',
    date: ''
  });
  
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [tokenId, setTokenId] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        setMessage('Wallet connected successfully!');
      } catch (error) {
        setMessage('Failed to connect wallet: ' + error.message);
      }
    } else {
      setMessage('Please install MetaMask to use this feature.');
    }
  };

  const mintCertificate = async () => {
    if (!account) {
      setMessage('Please connect your wallet first.');
      return;
    }

    setLoading(true);
    setMessage('');
    setTransactionHash('');
    setTokenId('');

    try {
      // Check if we're on Sepolia testnet
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0xaa36a7') { // Sepolia chain ID
        // Request to switch to Sepolia
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],
          });
        } catch (switchError) {
          // This error code indicates that the chain has not been added to MetaMask.
          if (switchError.code === 4902) {
            setMessage('Please add the Sepolia network to your MetaMask wallet.');
          } else {
            setMessage('Failed to switch to the Sepolia network.');
          }
          setLoading(false);
          return;
        }
      }

      // Create the metadata string
      const metadata = `姓名:${formData.studentName}, 课程:${formData.courseName}, 机构:${formData.issuer}, 日期:${formData.date}`;

      // Initialize ethers provider and signer
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      // Contract ABI (you'll need to replace this with your actual contract ABI)
      const contractABI = [
        // Replace with your contract's ABI
        "function safeMint(address to, string memory _metadata) public returns (uint256)"
      ];

      // Contract address (replace with your actual contract address)
      const contractAddress = "0xYourContractAddress...";
      
      // Create contract instance
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      // Call the safeMint function
      const transaction = await contract.safeMint(account, metadata);
      
      // Wait for transaction to be mined
      const receipt = await transaction.wait();
      
      // Extract token ID from the event (assuming standard ERC721 event)
      const tokenIdHex = receipt.events?.find(e => e.event === 'Transfer')?.args?.tokenId;
      const tokenId = tokenIdHex ? tokenIdHex.toString() : 'Unknown';
      
      // Set success state
      setTransactionHash(receipt.transactionHash);
      setTokenId(tokenId);
      setMessage('Certificate minted successfully!');
    } catch (error) {
      console.error('Minting error:', error);
      setMessage('Error minting certificate: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
      <h2>学习证书 NFT 铸造</h2>
      
      {!account ? (
        <button onClick={connectWallet} style={{ marginBottom: '20px' }}>
          连接钱包
        </button>
      ) : (
        <div style={{ marginBottom: '20px' }}>
          <p>已连接: {account.substring(0, 6)}...{account.substring(account.length - 4)}</p>
        </div>
      )}
      
      <div style={{ marginBottom: '15px' }}>
        <label>学员姓名:</label>
        <input
          type="text"
          name="studentName"
          value={formData.studentName}
          onChange={handleChange}
          style={{ width: '100%', padding: '8px', marginTop: '5px' }}
        />
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label>课程名称:</label>
        <input
          type="text"
          name="courseName"
          value={formData.courseName}
          onChange={handleChange}
          style={{ width: '100%', padding: '8px', marginTop: '5px' }}
        />
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label>颁发机构:</label>
        <input
          type="text"
          name="issuer"
          value={formData.issuer}
          onChange={handleChange}
          style={{ width: '100%', padding: '8px', marginTop: '5px' }}
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label>日期:</label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          style={{ width: '100%', padding: '8px', marginTop: '5px' }}
        />
      </div>
      
      <button 
        onClick={mintCertificate} 
        disabled={loading}
        style={{ 
          width: '100%', 
          padding: '12px', 
          backgroundColor: '#4CAF50', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? '铸造中...' : '生成证书并上链'}
      </button>
      
      {message && (
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          borderRadius: '4px',
          backgroundColor: message.includes('Error') || message.includes('Failed') ? '#ffebee' : '#e8f5e9',
          color: message.includes('Error') || message.includes('Failed') ? '#c62828' : '#2e7d32'
        }}>
          <p>{message}</p>
          {transactionHash && (
            <p>交易哈希: {transactionHash}</p>
          )}
          {tokenId && (
            <p>Token ID: {tokenId}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CertificateMinter;