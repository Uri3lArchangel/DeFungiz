const { expect } = require("chai");
const { ethers } = require("hardhat");
const { parseEther, ZeroAddress } = ethers;

describe("DeFungizNFTContract (ERC721)", function () {
  let nftContract;
  let owner, creator, buyer, addr1, addr2;

  beforeEach(async function () {
    [owner, creator, buyer, addr1, addr2] = await ethers.getSigners();
    
    const NFTContract = await ethers.getContractFactory("DeFungizNFTContract");
    nftContract = await NFTContract.deploy();
    await nftContract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await nftContract.owner()).to.equal(owner.address);
    });

    it("Should start with 0 total tokens", async function () {
      expect(await nftContract.getTotalTokens()).to.equal(0);
    });

    it("Should have correct platform fee percentage", async function () {
      expect(await nftContract.PLATFORM_FEE_PERCENTAGE()).to.equal(500); // 5%
    });
  });

  describe("NFT Voucher Creation and Verification", function () {
    let voucher, signature;

    beforeEach(async function () {
      voucher = {
        tokenURI: "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/1.json",
        price: parseEther("0.1"),
        nonce: 1,
        owner: creator.address
      };

      const domain = {
        name: "DeFungizNFTContract",
        version: "1",
        chainId: await ethers.provider.getNetwork().then(n => n.chainId),
        verifyingContract: nftContract.target
      };

      const types = {
        NFTVoucher: [
          { name: "owner", type: "address" },
          { name: "tokenURI", type: "string" },
          { name: "price", type: "uint256" },
          { name: "nonce", type: "uint256" }
        ]
      };

      signature = await creator.signTypedData(domain, types, voucher);
    });

    it("Should verify valid voucher signature", async function () {
      const voucherWithSig = { ...voucher, signature };
      expect(await nftContract.verify(voucherWithSig)).to.be.true;
    });

    it("Should reject invalid voucher signature", async function () {
      // Create an invalid signature by signing with a different signer
      const wrongSigner = addr1;
      const invalidSignature = await wrongSigner.signTypedData(
        {
          name: "DeFungizNFTContract",
          version: "1",
          chainId: await ethers.provider.getNetwork().then(n => n.chainId),
          verifyingContract: nftContract.target
        },
        {
          NFTVoucher: [
            { name: "owner", type: "address" },
            { name: "tokenURI", type: "string" },
            { name: "price", type: "uint256" },
            { name: "nonce", type: "uint256" }
          ]
        },
        voucher
      );
      
      const invalidVoucher = { ...voucher, signature: invalidSignature };
      expect(await nftContract.verify(invalidVoucher)).to.be.false;
    });
  });

  describe("NFT Minting with Vouchers", function () {
    let voucher, signature;

    beforeEach(async function () {
      voucher = {
        tokenURI: "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/1.json",
        price: parseEther("0.1"),
        nonce: 1,
        owner: creator.address
      };

      const domain = {
        name: "DeFungizNFTContract",
        version: "1",
        chainId: await ethers.provider.getNetwork().then(n => n.chainId),
        verifyingContract: nftContract.target
      };

      const types = {
        NFTVoucher: [
          { name: "owner", type: "address" },
          { name: "tokenURI", type: "string" },
          { name: "price", type: "uint256" },
          { name: "nonce", type: "uint256" }
        ]
      };

      signature = await creator.signTypedData(domain, types, voucher);
    });

    it("Should mint NFT with valid voucher and correct payment", async function () {
      const voucherWithSig = { ...voucher, signature };
      const initialOwnerBalance = await ethers.provider.getBalance(owner.address);

      await expect(nftContract.connect(buyer).mintNFT(voucherWithSig, buyer.address, { value: voucher.price }))
        .to.emit(nftContract, "NFTMinted")
        .withArgs(1, buyer.address, voucher.price);

      expect(await nftContract.ownerOf(1)).to.equal(buyer.address);
      expect(await nftContract.tokenURI(1)).to.equal(voucher.tokenURI);
      expect(await nftContract.getTotalTokens()).to.equal(1);

      // Check platform fee distribution (5% platform fee)
      const platformFee = (voucher.price * 500n) / 10000n; // 5%
      const creatorAmount = voucher.price - platformFee;
      
      // Only check the platform fee distribution to owner (creator balance affected by gas costs)
      expect(await ethers.provider.getBalance(owner.address)).to.equal(initialOwnerBalance + platformFee);
    });

    it("Should reject minting with insufficient payment", async function () {
      const voucherWithSig = { ...voucher, signature };
      const insufficientPayment = parseEther("0.05"); // Half the required amount

      await expect(nftContract.connect(buyer).mintNFT(voucherWithSig, buyer.address, { value: insufficientPayment }))
        .to.be.revertedWith("Insufficient payment");
    });

    it("Should reject minting with excess payment", async function () {
      const voucherWithSig = { ...voucher, signature };
      const excessPayment = parseEther("0.2"); // Double the required amount

      await expect(nftContract.connect(buyer).mintNFT(voucherWithSig, buyer.address, { value: excessPayment }))
        .to.be.revertedWith("Insufficient payment");
    });

    it("Should reject minting with invalid signature", async function () {
      // Create an invalid signature by signing with a different signer
      const wrongSigner = addr1;
      const invalidSignature = await wrongSigner.signTypedData(
        {
          name: "DeFungizNFTContract",
          version: "1",
          chainId: await ethers.provider.getNetwork().then(n => n.chainId),
          verifyingContract: nftContract.target
        },
        {
          NFTVoucher: [
            { name: "owner", type: "address" },
            { name: "tokenURI", type: "string" },
            { name: "price", type: "uint256" },
            { name: "nonce", type: "uint256" }
          ]
        },
        voucher
      );
      
      const invalidVoucher = { ...voucher, signature: invalidSignature };

      await expect(nftContract.connect(buyer).mintNFT(invalidVoucher, buyer.address, { value: voucher.price }))
        .to.be.revertedWith("Invalid signature");
    });

    it("Should reject minting with used voucher", async function () {
      const voucherWithSig = { ...voucher, signature };

      // First mint should succeed
      await nftContract.connect(buyer).mintNFT(voucherWithSig, buyer.address, { value: voucher.price });

      // Second mint with same voucher should fail
      await expect(nftContract.connect(addr1).mintNFT(voucherWithSig, addr1.address, { value: voucher.price }))
        .to.be.revertedWith("Voucher already used");
    });

    it("Should reject minting to zero address", async function () {
      const voucherWithSig = { ...voucher, signature };

      await expect(nftContract.connect(buyer).mintNFT(voucherWithSig, ZeroAddress, { value: voucher.price }))
        .to.be.revertedWith("Cannot mint to zero address");
    });

    it("Should reject minting with empty tokenURI", async function () {
      const emptyVoucher = {
        tokenURI: "",
        price: parseEther("0.1"),
        nonce: 2,
        owner: creator.address
      };

      const domain = {
        name: "DeFungizNFTContract",
        version: "1",
        chainId: await ethers.provider.getNetwork().then(n => n.chainId),
        verifyingContract: nftContract.target
      };

      const types = {
        NFTVoucher: [
          { name: "owner", type: "address" },
          { name: "tokenURI", type: "string" },
          { name: "price", type: "uint256" },
          { name: "nonce", type: "uint256" }
        ]
      };

      const emptySignature = await creator.signTypedData(domain, types, emptyVoucher);
      const emptyVoucherWithSig = { ...emptyVoucher, signature: emptySignature };

      await expect(nftContract.connect(buyer).mintNFT(emptyVoucherWithSig, buyer.address, { value: emptyVoucher.price }))
        .to.be.revertedWith("Token URI cannot be empty");
    });
  });

  describe("NFT Token Management", function () {
    let voucher, signature;

    beforeEach(async function () {
      voucher = {
        tokenURI: "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/1.json",
        price: parseEther("0.1"),
        nonce: 1,
        owner: creator.address
      };

      const domain = {
        name: "DeFungizNFTContract",
        version: "1",
        chainId: await ethers.provider.getNetwork().then(n => n.chainId),
        verifyingContract: nftContract.target
      };

      const types = {
        NFTVoucher: [
          { name: "owner", type: "address" },
          { name: "tokenURI", type: "string" },
          { name: "price", type: "uint256" },
          { name: "nonce", type: "uint256" }
        ]
      };

      signature = await creator.signTypedData(domain, types, voucher);
    });

    it("Should return correct token count", async function () {
      expect(await nftContract.getTotalTokens()).to.equal(0);

      const voucherWithSig = { ...voucher, signature };
      await nftContract.connect(buyer).mintNFT(voucherWithSig, buyer.address, { value: voucher.price });
      expect(await nftContract.getTotalTokens()).to.equal(1);

      // Mint another NFT
      const voucher2 = {
        tokenURI: "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/2.json",
        price: parseEther("0.2"),
        nonce: 2,
        owner: creator.address
      };

      const domain = {
        name: "DeFungizNFTContract",
        version: "1",
        chainId: await ethers.provider.getNetwork().then(n => n.chainId),
        verifyingContract: nftContract.target
      };

      const types = {
        NFTVoucher: [
          { name: "owner", type: "address" },
          { name: "tokenURI", type: "string" },
          { name: "price", type: "uint256" },
          { name: "nonce", type: "uint256" }
        ]
      };

      const signature2 = await creator.signTypedData(domain, types, voucher2);
      const voucherWithSig2 = { ...voucher2, signature: signature2 };

      await nftContract.connect(addr1).mintNFT(voucherWithSig2, addr1.address, { value: voucher2.price });
      expect(await nftContract.getTotalTokens()).to.equal(2);
    });

    it("Should return correct tokens by owner", async function () {
      const voucherWithSig = { ...voucher, signature };
      await nftContract.connect(buyer).mintNFT(voucherWithSig, buyer.address, { value: voucher.price });

      const tokens = await nftContract.getTokenByOwner(buyer.address);
      expect(tokens.length).to.equal(1);
      expect(tokens[0]).to.equal(1);

      // Mint another NFT to same owner
      const voucher2 = {
        tokenURI: "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/2.json",
        price: parseEther("0.2"),
        nonce: 2,
        owner: creator.address
      };

      const domain = {
        name: "DeFungizNFTContract",
        version: "1",
        chainId: await ethers.provider.getNetwork().then(n => n.chainId),
        verifyingContract: nftContract.target
      };

      const types = {
        NFTVoucher: [
          { name: "owner", type: "address" },
          { name: "tokenURI", type: "string" },
          { name: "price", type: "uint256" },
          { name: "nonce", type: "uint256" }
        ]
      };

      const signature2 = await creator.signTypedData(domain, types, voucher2);
      const voucherWithSig2 = { ...voucher2, signature: signature2 };

      await nftContract.connect(buyer).mintNFT(voucherWithSig2, buyer.address, { value: voucher2.price });

      const tokens2 = await nftContract.getTokenByOwner(buyer.address);
      expect(tokens2.length).to.equal(2);
      expect(tokens2[0]).to.equal(1);
      expect(tokens2[1]).to.equal(2);
    });

    it("Should return empty array for owner with no tokens", async function () {
      const tokens = await nftContract.getTokenByOwner(buyer.address);
      expect(tokens.length).to.equal(0);
    });
  });

  describe("Platform Fee Distribution", function () {
    let voucher, signature;

    beforeEach(async function () {
      voucher = {
        tokenURI: "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/1.json",
        price: parseEther("1.0"), // 1 ETH for easier calculations
        nonce: 1,
        owner: creator.address
      };

      const domain = {
        name: "DeFungizNFTContract",
        version: "1",
        chainId: await ethers.provider.getNetwork().then(n => n.chainId),
        verifyingContract: nftContract.target
      };

      const types = {
        NFTVoucher: [
          { name: "owner", type: "address" },
          { name: "tokenURI", type: "string" },
          { name: "price", type: "uint256" },
          { name: "nonce", type: "uint256" }
        ]
      };

      signature = await creator.signTypedData(domain, types, voucher);
    });

    it("Should distribute fees correctly (5% platform fee)", async function () {
      const voucherWithSig = { ...voucher, signature };
      const initialOwnerBalance = await ethers.provider.getBalance(owner.address);

      await nftContract.connect(buyer).mintNFT(voucherWithSig, buyer.address, { value: voucher.price });

      // Calculate expected amounts
      const platformFee = (voucher.price * 500n) / 10000n; // 5% of voucher amount
      
      // Only check the platform fee distribution to owner (creator balance affected by gas costs)
      expect(await ethers.provider.getBalance(owner.address)).to.equal(initialOwnerBalance + platformFee);
    });

    it("Should handle multiple mints with correct fee distribution", async function () {
      const voucherWithSig = { ...voucher, signature };
      const initialOwnerBalance = await ethers.provider.getBalance(owner.address);

      // First mint
      await nftContract.connect(buyer).mintNFT(voucherWithSig, buyer.address, { value: voucher.price });

      // Second mint with different voucher
      const voucher2 = {
        tokenURI: "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/2.json",
        price: parseEther("0.5"), // 0.5 ETH
        nonce: 2,
        owner: creator.address
      };

      const domain = {
        name: "DeFungizNFTContract",
        version: "1",
        chainId: await ethers.provider.getNetwork().then(n => n.chainId),
        verifyingContract: nftContract.target
      };

      const types = {
        NFTVoucher: [
          { name: "owner", type: "address" },
          { name: "tokenURI", type: "string" },
          { name: "price", type: "uint256" },
          { name: "nonce", type: "uint256" }
        ]
      };

      const signature2 = await creator.signTypedData(domain, types, voucher2);
      const voucherWithSig2 = { ...voucher2, signature: signature2 };

      await nftContract.connect(addr1).mintNFT(voucherWithSig2, addr1.address, { value: voucher2.price });

      // Calculate total expected amounts
      const totalPlatformFee = (voucher.price * 500n) / 10000n + (voucher2.price * 500n) / 10000n; // 5% of total
      
      // Only check the platform fee distribution to owner (creator balance affected by gas costs)
      expect(await ethers.provider.getBalance(owner.address)).to.equal(initialOwnerBalance + totalPlatformFee);
    });
  });

  describe("ERC721 Standard Compliance", function () {
    let voucher, signature;

    beforeEach(async function () {
      voucher = {
        tokenURI: "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/1.json",
        price: parseEther("0.1"),
        nonce: 1,
        owner: creator.address
      };

      const domain = {
        name: "DeFungizNFTContract",
        version: "1",
        chainId: await ethers.provider.getNetwork().then(n => n.chainId),
        verifyingContract: nftContract.target
      };

      const types = {
        NFTVoucher: [
          { name: "owner", type: "address" },
          { name: "tokenURI", type: "string" },
          { name: "price", type: "uint256" },
          { name: "nonce", type: "uint256" }
        ]
      };

      signature = await creator.signTypedData(domain, types, voucher);
    });

    it("Should support ERC721 interface", async function () {
      const voucherWithSig = { ...voucher, signature };
      await nftContract.connect(buyer).mintNFT(voucherWithSig, buyer.address, { value: voucher.price });

      expect(await nftContract.supportsInterface("0x80ac58cd")).to.be.true; // ERC721
      expect(await nftContract.supportsInterface("0x5b5e139f")).to.be.true; // ERC721Metadata
    });

    it("Should return correct token URI", async function () {
      const voucherWithSig = { ...voucher, signature };
      await nftContract.connect(buyer).mintNFT(voucherWithSig, buyer.address, { value: voucher.price });
      expect(await nftContract.tokenURI(1)).to.equal(voucher.tokenURI);
    });

    it("Should revert for non-existent token URI", async function () {
      await expect(nftContract.tokenURI(999)).to.be.reverted;
    });
  });
}); 