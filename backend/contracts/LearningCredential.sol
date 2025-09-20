// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LearningCredential is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    
    mapping(uint256 => string) public credentialMetadata;
    mapping(uint256 => bool) public revokedCertificates;
    
    // 管理员地址列表（可以撤销证书的地址）
    mapping(address => bool) public administrators;
    
    // 血缘追溯相关结构
    struct CertificateEvent {
        string eventType;      // 事件类型: "minted", "revoked", "modified"
        address operator;      // 操作者地址
        string details;        // 详细信息
        uint256 timestamp;     // 时间戳
    }
    
    // 证书历史记录映射
    mapping(uint256 => CertificateEvent[]) public certificateHistory;

    constructor(address initialOwner) 
        ERC721("LearningCredential", "LRN") 
        Ownable(initialOwner) 
    {
        // 将合约所有者设为默认管理员
        administrators[initialOwner] = true;
    }

    // 添加管理员
    function addAdministrator(address admin) public onlyOwner {
        administrators[admin] = true;
    }
    
    // 移除管理员
    function removeAdministrator(address admin) public onlyOwner {
        administrators[admin] = false;
    }

    // 添加历史记录的内部函数
    function _addHistory(uint256 tokenId, string memory eventType, string memory details) internal {
        certificateHistory[tokenId].push(CertificateEvent({
            eventType: eventType,
            operator: msg.sender,
            details: details,
            timestamp: block.timestamp
        }));
    }

    function safeMint(address to, string memory _metadata) public onlyOwner {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(to, tokenId);
        credentialMetadata[tokenId] = _metadata;
        
        // 添加铸造事件到历史记录
        _addHistory(tokenId, "minted", _metadata);
    }

    function getMetadata(uint256 tokenId) public view returns (string memory) {
        return credentialMetadata[tokenId];
    }
    
    // 只有管理员可以撤销证书
    function revokeCertificate(uint256 tokenId) public {
        require(administrators[msg.sender], "Only administrators can revoke certificates");
        require(_ownerOf(tokenId) != address(0), "Certificate does not exist");
        revokedCertificates[tokenId] = true;
        
        // 添加撤销事件到历史记录
        _addHistory(tokenId, "revoked", "Certificate revoked by administrator");
    }
    
    function isRevoked(uint256 tokenId) public view returns (bool) {
        return revokedCertificates[tokenId];
    }
    
    function certificateStatus(uint256 tokenId) public view returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) {
            return unicode"不存在";
        }
        if (revokedCertificates[tokenId]) {
            return unicode"已撤销";
        }
        return unicode"有效";
    }
    
    // 获取证书历史记录数量
    function getHistoryCount(uint256 tokenId) public view returns (uint256) {
        return certificateHistory[tokenId].length;
    }
    
    // 获取证书历史记录
    function getCertificateHistory(uint256 tokenId) public view returns (CertificateEvent[] memory) {
        return certificateHistory[tokenId];
    }
    
    // 获取特定索引的历史记录
    function getHistoryEntry(uint256 tokenId, uint256 index) public view returns (CertificateEvent memory) {
        require(index < certificateHistory[tokenId].length, "Index out of bounds");
        return certificateHistory[tokenId][index];
    }
}