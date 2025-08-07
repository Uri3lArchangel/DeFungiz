const { ethers } = require('ethers');

/**
 * Lazy Minting Utility Functions
 * This file contains helper functions for the DeFungiz NFT contract lazy minting feature
 * Supports both ERC721 and ERC1155 collections
 */

class LazyMintingUtils {
    constructor(contractAddress, signer) {
        this.contractAddress = contractAddress;
        this.signer = signer;
        this.contract = null;
    }

    /**
     * Initialize contract instance
     * @param {string} contractABI - Contract ABI
     */
    initializeContract(contractABI) {
        this.contract = new ethers.Contract(this.contractAddress, contractABI, this.signer);
    }

    /**
     * Generate lazy mint signature
     * @param {Object} lazyMintData - Lazy mint data
     * @param {string} lazyMintData.to - Recipient address
     * @param {string} lazyMintData.tokenURI - Token metadata URI
     * @param {number} lazyMintData.collectionId - Collection ID (0 for no collection)
     * @param {number} lazyMintData.amount - Amount to mint (for ERC1155)
     * @param {number} lazyMintData.nonce - Nonce for replay protection
     * @param {number} lazyMintData.deadline - Signature expiration timestamp
     * @returns {string} - Signature
     */
    async generateLazyMintSignature(lazyMintData) {
        const messageHash = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
                ['address', 'string', 'uint256', 'uint256', 'uint256', 'uint256'],
                [
                    lazyMintData.to,
                    lazyMintData.tokenURI,
                    lazyMintData.collectionId,
                    lazyMintData.amount,
                    lazyMintData.nonce,
                    lazyMintData.deadline
                ]
            )
        );

        const ethSignedMessageHash = ethers.utils.hashMessage(ethers.utils.arrayify(messageHash));
        const signature = await this.signer.signMessage(ethers.utils.arrayify(messageHash));

        return signature;
    }

    /**
     * Create lazy mint data structure
     * @param {string} to - Recipient address
     * @param {string} tokenURI - Token metadata URI
     * @param {number} collectionId - Collection ID (0 for no collection)
     * @param {number} amount - Amount to mint (for ERC1155, default 1 for ERC721)
     * @param {number} deadline - Signature expiration timestamp (in seconds)
     * @returns {Object} - Lazy mint data
     */
    async createLazyMintData(to, tokenURI, collectionId = 0, amount = 1, deadline = 3600) {
        const nonce = await this.contract.getNonce(to);
        const expirationTime = Math.floor(Date.now() / 1000) + deadline;

        return {
            to: to,
            tokenURI: tokenURI,
            collectionId: collectionId,
            amount: amount,
            nonce: nonce,
            deadline: expirationTime
        };
    }

    /**
     * Execute lazy mint transaction
     * @param {Object} lazyMintData - Lazy mint data
     * @param {string} signature - Signature
     * @returns {Object} - Transaction result
     */
    async executeLazyMint(lazyMintData, signature) {
        if (!this.contract) {
            throw new Error('Contract not initialized. Call initializeContract() first.');
        }

        const tx = await this.contract.lazyMintNFT(lazyMintData, signature);
        const receipt = await tx.wait();

        return {
            transactionHash: tx.hash,
            receipt: receipt,
            events: receipt.events
        };
    }

    /**
     * Verify signature validity
     * @param {Object} lazyMintData - Lazy mint data
     * @param {string} signature - Signature
     * @param {string} expectedSigner - Expected signer address
     * @returns {boolean} - True if signature is valid
     */
    verifySignature(lazyMintData, signature, expectedSigner) {
        const messageHash = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
                ['address', 'string', 'uint256', 'uint256', 'uint256', 'uint256'],
                [
                    lazyMintData.to,
                    lazyMintData.tokenURI,
                    lazyMintData.collectionId,
                    lazyMintData.amount,
                    lazyMintData.nonce,
                    lazyMintData.deadline
                ]
            )
        );

        const ethSignedMessageHash = ethers.utils.hashMessage(ethers.utils.arrayify(messageHash));
        const recoveredSigner = ethers.utils.recoverAddress(ethSignedMessageHash, signature);

        return recoveredSigner.toLowerCase() === expectedSigner.toLowerCase();
    }

    /**
     * Check if signature is expired
     * @param {number} deadline - Signature deadline timestamp
     * @returns {boolean} - True if signature is expired
     */
    isSignatureExpired(deadline) {
        const currentTime = Math.floor(Date.now() / 1000);
        return currentTime > deadline;
    }

    /**
     * Get current timestamp
     * @returns {number} - Current timestamp in seconds
     */
    getCurrentTimestamp() {
        return Math.floor(Date.now() / 1000);
    }

    /**
     * Check if collection is ERC1155
     * @param {number} collectionId - Collection ID
     * @returns {boolean} - True if collection is ERC1155
     */
    async isERC1155Collection(collectionId) {
        if (!this.contract) {
            throw new Error('Contract not initialized. Call initializeContract() first.');
        }

        const collection = await this.contract.getCollection(collectionId);
        return collection.isERC1155;
    }
}

/**
 * Example usage functions
 */

/**
 * Example: Create and execute a lazy mint (ERC721 or ERC1155)
 * @param {Object} provider - Ethers provider
 * @param {Object} signer - Ethers signer (minter)
 * @param {string} contractAddress - Contract address
 * @param {string} contractABI - Contract ABI
 * @param {string} recipient - Recipient address
 * @param {string} tokenURI - Token metadata URI
 * @param {number} collectionId - Collection ID
 * @param {number} amount - Amount to mint (for ERC1155)
 */
async function exampleLazyMint(provider, signer, contractAddress, contractABI, recipient, tokenURI, collectionId = 0, amount = 1) {
    try {
        const lazyMintingUtils = new LazyMintingUtils(contractAddress, signer);
        lazyMintingUtils.initializeContract(contractABI);

        // Check if collection is ERC1155
        let isERC1155 = false;
        if (collectionId > 0) {
            isERC1155 = await lazyMintingUtils.isERC1155Collection(collectionId);
            console.log(`Collection ${collectionId} is ERC1155:`, isERC1155);
        }

        // Create lazy mint data
        const lazyMintData = await lazyMintingUtils.createLazyMintData(
            recipient, 
            tokenURI, 
            collectionId,
            amount
        );
        console.log('Lazy mint data:', lazyMintData);

        // Generate signature
        const signature = await lazyMintingUtils.generateLazyMintSignature(lazyMintData);
        console.log('Signature:', signature);

        // Verify signature
        const signerAddress = await signer.getAddress();
        const isValid = lazyMintingUtils.verifySignature(lazyMintData, signature, signerAddress);
        console.log('Signature valid:', isValid);

        // Execute lazy mint
        const result = await lazyMintingUtils.executeLazyMint(lazyMintData, signature);
        console.log('Lazy mint successful:', result);

        return result;
    } catch (error) {
        console.error('Lazy mint failed:', error);
        throw error;
    }
}

/**
 * Example: Lazy mint ERC721 NFT
 * @param {Object} provider - Ethers provider
 * @param {Object} signer - Ethers signer (minter)
 * @param {string} contractAddress - Contract address
 * @param {string} contractABI - Contract ABI
 * @param {string} recipient - Recipient address
 * @param {string} tokenURI - Token metadata URI
 * @param {number} collectionId - Collection ID (0 for standalone)
 */
async function exampleLazyMintERC721(provider, signer, contractAddress, contractABI, recipient, tokenURI, collectionId = 0) {
    return await exampleLazyMint(provider, signer, contractAddress, contractABI, recipient, tokenURI, collectionId, 1);
}

/**
 * Example: Lazy mint ERC1155 tokens
 * @param {Object} provider - Ethers provider
 * @param {Object} signer - Ethers signer (minter)
 * @param {string} contractAddress - Contract address
 * @param {string} contractABI - Contract ABI
 * @param {string} recipient - Recipient address
 * @param {string} tokenURI - Token metadata URI
 * @param {number} collectionId - Collection ID
 * @param {number} amount - Amount to mint
 */
async function exampleLazyMintERC1155(provider, signer, contractAddress, contractABI, recipient, tokenURI, collectionId, amount) {
    return await exampleLazyMint(provider, signer, contractAddress, contractABI, recipient, tokenURI, collectionId, amount);
}

/**
 * Example: Batch lazy mint for ERC721 collection
 * @param {Object} provider - Ethers provider
 * @param {Object} signer - Ethers signer (minter)
 * @param {string} contractAddress - Contract address
 * @param {string} contractABI - Contract ABI
 * @param {Array} recipients - Array of recipient addresses
 * @param {Array} tokenURIs - Array of token metadata URIs
 * @param {number} collectionId - Collection ID
 */
async function exampleBatchLazyMintERC721(provider, signer, contractAddress, contractABI, recipients, tokenURIs, collectionId) {
    const lazyMintingUtils = new LazyMintingUtils(contractAddress, signer);
    lazyMintingUtils.initializeContract(contractABI);

    const results = [];

    for (let i = 0; i < recipients.length; i++) {
        try {
            const lazyMintData = await lazyMintingUtils.createLazyMintData(recipients[i], tokenURIs[i], collectionId, 1);
            const signature = await lazyMintingUtils.generateLazyMintSignature(lazyMintData);
            const result = await lazyMintingUtils.executeLazyMint(lazyMintData, signature);
            
            results.push({
                recipient: recipients[i],
                tokenURI: tokenURIs[i],
                result: result
            });

            console.log(`ERC721 Lazy mint ${i + 1}/${recipients.length} successful`);
        } catch (error) {
            console.error(`ERC721 Lazy mint ${i + 1}/${recipients.length} failed:`, error);
            results.push({
                recipient: recipients[i],
                tokenURI: tokenURIs[i],
                error: error.message
            });
        }
    }

    return results;
}

/**
 * Example: Batch lazy mint for ERC1155 collection
 * @param {Object} provider - Ethers provider
 * @param {Object} signer - Ethers signer (minter)
 * @param {string} contractAddress - Contract address
 * @param {string} contractABI - Contract ABI
 * @param {Array} recipients - Array of recipient addresses
 * @param {Array} tokenURIs - Array of token metadata URIs
 * @param {Array} amounts - Array of amounts to mint
 * @param {number} collectionId - Collection ID
 */
async function exampleBatchLazyMintERC1155(provider, signer, contractAddress, contractABI, recipients, tokenURIs, amounts, collectionId) {
    const lazyMintingUtils = new LazyMintingUtils(contractAddress, signer);
    lazyMintingUtils.initializeContract(contractABI);

    const results = [];

    for (let i = 0; i < recipients.length; i++) {
        try {
            const lazyMintData = await lazyMintingUtils.createLazyMintData(recipients[i], tokenURIs[i], collectionId, amounts[i]);
            const signature = await lazyMintingUtils.generateLazyMintSignature(lazyMintData);
            const result = await lazyMintingUtils.executeLazyMint(lazyMintData, signature);
            
            results.push({
                recipient: recipients[i],
                tokenURI: tokenURIs[i],
                amount: amounts[i],
                result: result
            });

            console.log(`ERC1155 Lazy mint ${i + 1}/${recipients.length} successful`);
        } catch (error) {
            console.error(`ERC1155 Lazy mint ${i + 1}/${recipients.length} failed:`, error);
            results.push({
                recipient: recipients[i],
                tokenURI: tokenURIs[i],
                amount: amounts[i],
                error: error.message
            });
        }
    }

    return results;
}

module.exports = {
    LazyMintingUtils,
    exampleLazyMint,
    exampleLazyMintERC721,
    exampleLazyMintERC1155,
    exampleBatchLazyMintERC721,
    exampleBatchLazyMintERC1155
}; 