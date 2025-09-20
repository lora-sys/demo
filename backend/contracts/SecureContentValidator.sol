// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SecureContentValidator {
    // 地址锁定映射
    mapping(address => uint256) public lockedUntil;
    mapping(address => uint256) public failedAttempts;
    
    // 验证日志
    struct VerificationLog {
        address user;
        uint256 tokenId;
        bytes32 contentHash;
        bool isValid;
        uint256 timestamp;
    }
    
    VerificationLog[] public verificationLogs;
    
    // 事件
    event ContentVerified(address indexed user, uint256 indexed tokenId, bytes32 contentHash, bool isValid);
    event AddressLocked(address indexed user);
    
    // 验证内容函数
    function verifyContent(string memory content, bytes32 expectedHash, uint256 tokenId) public {
        // 检查地址是否被锁定
        require(block.timestamp > lockedUntil[msg.sender], "Address is locked");
        
        // 计算内容哈希
        bytes32 actualHash = keccak256(abi.encodePacked(content));
        
        // 验证哈希
        bool isValid = (actualHash == expectedHash);
        
        // 记录验证日志
        verificationLogs.push(VerificationLog({
            user: msg.sender,
            tokenId: tokenId,
            contentHash: actualHash,
            isValid: isValid,
            timestamp: block.timestamp
        }));
        
        // 如果验证失败，增加失败次数
        if (!isValid) {
            failedAttempts[msg.sender] += 1;
            
            // 如果失败次数超过3次，锁定地址1小时
            if (failedAttempts[msg.sender] >= 3) {
                lockedUntil[msg.sender] = block.timestamp + 1 hours;
                emit AddressLocked(msg.sender);
            }
        } else {
            // 验证成功，重置失败次数
            failedAttempts[msg.sender] = 0;
        }
        
        emit ContentVerified(msg.sender, tokenId, actualHash, isValid);
    }
    
    // 获取验证日志数量
    function getVerificationLogsCount() public view returns (uint256) {
        return verificationLogs.length;
    }
    
    // 获取验证日志
    function getVerificationLogs(uint256 startIndex, uint256 count) public view returns (VerificationLog[] memory) {
        require(startIndex < verificationLogs.length, "Start index out of bounds");
        
        uint256 endIndex = startIndex + count;
        if (endIndex > verificationLogs.length) {
            endIndex = verificationLogs.length;
        }
        
        VerificationLog[] memory result = new VerificationLog[](endIndex - startIndex);
        for (uint256 i = startIndex; i < endIndex; i++) {
            result[i - startIndex] = verificationLogs[i];
        }
        
        return result;
    }
    
    // 检查地址是否被锁定
    function isAddressLocked(address user) public view returns (bool) {
        return block.timestamp <= lockedUntil[user];
    }
    
    // 获取地址的失败尝试次数
    function getFailedAttempts(address user) public view returns (uint256) {
        return failedAttempts[user];
    }
    
    // 获取地址解锁时间
    function getUnlockTime(address user) public view returns (uint256) {
        return lockedUntil[user];
    }
}