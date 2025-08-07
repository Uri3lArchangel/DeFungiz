const { ethers } = require("ethers");

class VoucherUtils {
  constructor(contractAddress, chainId) {
    this.contractAddress = contractAddress;
    this.chainId = chainId;
  }

  /**
   * Create ERC721 NFT voucher
   * @param {string} owner - Creator's address
   * @param {string} tokenURI - NFT metadata URI
   * @param {string} price - Price in ETH
   * @param {number} nonce - Unique nonce
   * @param {ethers.Signer} signer - Creator's signer
   * @returns {Object} Voucher with signature
   */
  async createERC721Voucher(owner, tokenURI, price, nonce, signer) {
    const voucher = {
      owner: owner,
      tokenURI: tokenURI,
      price: ethers.utils.parseEther(price.toString()),
      nonce: nonce
    };

    const domain = {
      name: "DeFungizNFTContract",
      version: "1",
      chainId: this.chainId,
      verifyingContract: this.contractAddress
    };

    const types = {
      NFTVoucher: [
        { name: "owner", type: "address" },
        { name: "tokenURI", type: "string" },
        { name: "price", type: "uint256" },
        { name: "nonce", type: "uint256" }
      ]
    };

    const signature = await signer._signTypedData(domain, types, voucher);

    return {
      ...voucher,
      signature: signature
    };
  }

  /**
   * Create ERC1155 Collection voucher
   * @param {string} owner - Creator's address
   * @param {string} name - Collection name
   * @param {string} description - Collection description
   * @param {string} baseURI - Collection base URI
   * @param {string} amount - Price in ETH
   * @param {number} nonce - Unique nonce
   * @param {ethers.Signer} signer - Creator's signer
   * @returns {Object} Voucher with signature
   */
  async createERC1155Voucher(owner, name, description, baseURI, amount, nonce, signer) {
    const voucher = {
      owner: owner,
      name: name,
      description: description,
      baseURI: baseURI,
      amount: ethers.utils.parseEther(amount.toString()),
      nonce: nonce
    };

    const domain = {
      name: "DeFungizNFTCollectionContract",
      version: "1",
      chainId: this.chainId,
      verifyingContract: this.contractAddress
    };

    const types = {
      CollectionVoucher: [
        { name: "owner", type: "address" },
        { name: "name", type: "string" },
        { name: "description", type: "string" },
        { name: "baseURI", type: "string" },
        { name: "amount", type: "uint256" },
        { name: "nonce", type: "uint256" }
      ]
    };

    const signature = await signer._signTypedData(domain, types, voucher);

    return {
      ...voucher,
      signature: signature
    };
  }

  /**
   * Verify ERC721 voucher signature
   * @param {Object} voucher - Voucher object
   * @param {ethers.Contract} contract - NFT contract instance
   * @returns {boolean} True if signature is valid
   */
  async verifyERC721Voucher(voucher, contract) {
    try {
      return await contract.verify(voucher);
    } catch (error) {
      console.error("Error verifying ERC721 voucher:", error);
      return false;
    }
  }

  /**
   * Verify ERC1155 voucher signature
   * @param {Object} voucher - Voucher object
   * @param {string} signer - Expected signer address
   * @param {ethers.Contract} contract - NFT contract instance
   * @returns {boolean} True if signature is valid
   */
  async verifyERC1155Voucher(voucher, signer, contract) {
    try {
      return await contract.verify(voucher, signer);
    } catch (error) {
      console.error("Error verifying ERC1155 voucher:", error);
      return false;
    }
  }

  /**
   * Generate metadata for NFT
   * @param {string} name - NFT name
   * @param {string} description - NFT description
   * @param {string} image - Image URL
   * @param {Array} attributes - NFT attributes
   * @returns {Object} Metadata object
   */
  generateMetadata(name, description, image, attributes = []) {
    return {
      name: name,
      description: description,
      image: image,
      attributes: attributes,
      external_url: "https://defungiz.com",
      animation_url: null
    };
  }

  /**
   * Create batch of ERC721 vouchers
   * @param {string} owner - Creator's address
   * @param {Array} nfts - Array of NFT data
   * @param {ethers.Signer} signer - Creator's signer
   * @returns {Array} Array of vouchers
   */
  async createBatchERC721Vouchers(owner, nfts, signer) {
    const vouchers = [];
    
    for (let i = 0; i < nfts.length; i++) {
      const nft = nfts[i];
      const voucher = await this.createERC721Voucher(
        owner,
        nft.tokenURI,
        nft.price,
        nft.nonce,
        signer
      );
      vouchers.push(voucher);
    }

    return vouchers;
  }

  /**
   * Create batch of ERC1155 vouchers
   * @param {string} owner - Creator's address
   * @param {Array} collections - Array of collection data
   * @param {ethers.Signer} signer - Creator's signer
   * @returns {Array} Array of vouchers
   */
  async createBatchERC1155Vouchers(owner, collections, signer) {
    const vouchers = [];
    
    for (let i = 0; i < collections.length; i++) {
      const collection = collections[i];
      const voucher = await this.createERC1155Voucher(
        owner,
        collection.name,
        collection.description,
        collection.baseURI,
        collection.amount,
        collection.nonce,
        signer
      );
      vouchers.push(voucher);
    }

    return vouchers;
  }

  /**
   * Generate unique nonce
   * @returns {number} Unique nonce
   */
  generateNonce() {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  /**
   * Validate voucher data
   * @param {Object} voucher - Voucher object
   * @param {string} type - Voucher type ('ERC721' or 'ERC1155')
   * @returns {Object} Validation result
   */
  validateVoucher(voucher, type) {
    const errors = [];

    if (type === 'ERC721') {
      if (!voucher.owner || !ethers.utils.isAddress(voucher.owner)) {
        errors.push("Invalid owner address");
      }
      if (!voucher.tokenURI || voucher.tokenURI.trim() === "") {
        errors.push("Token URI is required");
      }
      if (!voucher.price || voucher.price <= 0) {
        errors.push("Price must be greater than 0");
      }
      if (!voucher.nonce || voucher.nonce <= 0) {
        errors.push("Nonce must be greater than 0");
      }
      if (!voucher.signature || voucher.signature.length !== 132) {
        errors.push("Invalid signature");
      }
    } else if (type === 'ERC1155') {
      if (!voucher.owner || !ethers.utils.isAddress(voucher.owner)) {
        errors.push("Invalid owner address");
      }
      if (!voucher.name || voucher.name.trim() === "") {
        errors.push("Collection name is required");
      }
      if (!voucher.description || voucher.description.trim() === "") {
        errors.push("Collection description is required");
      }
      if (!voucher.baseURI || voucher.baseURI.trim() === "") {
        errors.push("Base URI is required");
      }
      if (!voucher.amount || voucher.amount <= 0) {
        errors.push("Amount must be greater than 0");
      }
      if (!voucher.nonce || voucher.nonce <= 0) {
        errors.push("Nonce must be greater than 0");
      }
      if (!voucher.signature || voucher.signature.length !== 132) {
        errors.push("Invalid signature");
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}

module.exports = VoucherUtils; 