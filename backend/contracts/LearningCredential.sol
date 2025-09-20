// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LearningCredential is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    
    mapping(uint256 => string) public credentialMetadata;
    mapping(uint256 => bool) public revokedCertificates;

    constructor(address initialOwner) 
        ERC721("LearningCredential", "LRN") 
        Ownable(initialOwner) 
    {}

    function safeMint(address to, string memory _metadata) public onlyOwner {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(to, tokenId);
        credentialMetadata[tokenId] = _metadata;
    }

    function getMetadata(uint256 tokenId) public view returns (string memory) {
        return credentialMetadata[tokenId];
    }
    
    function revokeCertificate(uint256 tokenId) public onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Certificate does not exist");
        revokedCertificates[tokenId] = true;
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
}