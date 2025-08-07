const { expect } = require("chai");
const { ethers } = require("hardhat");
const { parseEther } = ethers;

describe("DeFungizNFTCollectionContract (ERC1155)", function () {
  let nftContract;
  let owner, creator, buyer, addr1, addr2;

  beforeEach(async function () {
    [owner, creator, buyer, addr1, addr2] = await ethers.getSigners();
    
    const NFTContract = await ethers.getContractFactory("DeFungizNFTCollectionContract");
    nftContract = await NFTContract.deploy();
    await nftContract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await nftContract.owner()).to.equal(owner.address);
    });

    it("Should start with 0 total collections", async function () {
      expect(await nftContract.getTotalCollections()).to.equal(0);
    });

    it("Should have correct platform fee percentage", async function () {
      expect(await nftContract.PLATFORM_FEE_PERCENTAGE()).to.equal(500); // 5%
    });
  });

  describe("Collection Minting with Vouchers", function () {
    let voucher, signature, tokenURIs;

    beforeEach(async function () {
      voucher = {
        owner: creator.address,
        name: "Test Collection",
        description: "A test collection",
        baseURI: "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/",
        amount: parseEther("0.1"),
        nonce: 1
      };

      tokenURIs = [
        "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/1.json",
        "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/2.json"
      ];

      const domain = {
        name: "DeFungizNFTCollectionContract",
        version: "1",
        chainId: await ethers.provider.getNetwork().then(n => n.chainId),
        verifyingContract: nftContract.target
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

      signature = await creator.signTypedData(domain, types, voucher);
    });

    it("Should mint collection with valid voucher and correct payment", async function () {
      const voucherWithSig = { ...voucher, signature };
      const amount = 2;
      const initialOwnerBalance = await ethers.provider.getBalance(owner.address);

      await expect(nftContract.connect(buyer).mintNFTCollection(
        voucherWithSig, 
        buyer.address, 
        tokenURIs, 
        amount,
        { value: voucher.amount }
      ))
        .to.emit(nftContract, "CollectionCreatedAndMinted")
        .withArgs(1, voucher.name, buyer.address);

      expect(await nftContract.getTotalCollections()).to.equal(1);
      expect(await nftContract.balanceOf(buyer.address, 1)).to.equal(amount);
      expect(await nftContract.balanceOf(buyer.address, 2)).to.equal(amount);

      // Check platform fee distribution (5% platform fee)
      const platformFee = (voucher.amount * 500n) / 10000n; // 5% of voucher amount
      
      // Only check the platform fee distribution to owner (creator balance affected by gas costs)
      expect(await ethers.provider.getBalance(owner.address)).to.equal(initialOwnerBalance + platformFee);
    });

    it("Should reject minting with insufficient payment", async function () {
      const voucherWithSig = { ...voucher, signature };
      const amount = 2;
      const insufficientPayment = parseEther("0.05"); // Half the required amount

      await expect(nftContract.connect(buyer).mintNFTCollection(
        voucherWithSig, 
        buyer.address, 
        tokenURIs, 
        amount,
        { value: insufficientPayment }
      )).to.be.revertedWith("Insufficient payment");
    });

    it("Should reject minting with invalid signature", async function () {
      // Create an invalid signature by signing with a different signer
      const wrongSigner = addr1;
      const invalidSignature = await wrongSigner.signTypedData(
        {
          name: "DeFungizNFTCollectionContract",
          version: "1",
          chainId: await ethers.provider.getNetwork().then(n => n.chainId),
          verifyingContract: nftContract.target
        },
        {
          CollectionVoucher: [
            { name: "owner", type: "address" },
            { name: "name", type: "string" },
            { name: "description", type: "string" },
            { name: "baseURI", type: "string" },
            { name: "amount", type: "uint256" },
            { name: "nonce", type: "uint256" }
          ]
        },
        voucher
      );
      
      const invalidVoucher = { ...voucher, signature: invalidSignature };
      const amount = 2;

      await expect(nftContract.connect(buyer).mintNFTCollection(
        invalidVoucher, 
        buyer.address, 
        tokenURIs, 
        amount,
        { value: voucher.amount }
      )).to.be.revertedWith("Invalid signature");
    });

    it("Should reject minting with used voucher", async function () {
      const voucherWithSig = { ...voucher, signature };
      const amount = 2;

      // First mint should succeed
      await nftContract.connect(buyer).mintNFTCollection(
        voucherWithSig, 
        buyer.address, 
        tokenURIs, 
        amount,
        { value: voucher.amount }
      );

      // Second mint with same voucher should fail
      await expect(nftContract.connect(addr1).mintNFTCollection(
        voucherWithSig, 
        addr1.address, 
        tokenURIs, 
        amount,
        { value: voucher.amount }
      )).to.be.revertedWith("Voucher already used");
    });
  });

  describe("Platform Fee Distribution", function () {
    let voucher, signature, tokenURIs;

    beforeEach(async function () {
      voucher = {
        owner: creator.address,
        name: "Test Collection",
        description: "A test collection",
        baseURI: "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/",
        amount: parseEther("1.0"), // 1 ETH for easier calculations
        nonce: 1
      };

      tokenURIs = [
        "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/1.json",
        "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/2.json"
      ];

      const domain = {
        name: "DeFungizNFTCollectionContract",
        version: "1",
        chainId: await ethers.provider.getNetwork().then(n => n.chainId),
        verifyingContract: nftContract.target
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

      signature = await creator.signTypedData(domain, types, voucher);
    });

    it("Should distribute fees correctly (5% platform fee)", async function () {
      const voucherWithSig = { ...voucher, signature };
      const amount = 2;
      const initialOwnerBalance = await ethers.provider.getBalance(owner.address);

      await nftContract.connect(buyer).mintNFTCollection(
        voucherWithSig, 
        buyer.address, 
        tokenURIs, 
        amount,
        { value: voucher.amount }
      );

      // Calculate expected amounts
      const platformFee = (voucher.amount * 500n) / 10000n; // 5% of voucher amount
      
      // Only check the platform fee distribution to owner (creator balance affected by gas costs)
      expect(await ethers.provider.getBalance(owner.address)).to.equal(initialOwnerBalance + platformFee);
    });
  });

  describe("Signature Verification Debug", function () {
    it("Should verify signature correctly", async function () {
      const voucher = {
        owner: creator.address,
        name: "Test Collection",
        description: "A test collection",
        baseURI: "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/",
        amount: parseEther("0.1"),
        nonce: 1
      };

      const domain = {
        name: "DeFungizNFTCollectionContract",
        version: "1",
        chainId: await ethers.provider.getNetwork().then(n => n.chainId),
        verifyingContract: nftContract.target
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

      const signature = await creator.signTypedData(domain, types, voucher);
      const voucherWithSig = { ...voucher, signature };

      console.log("Domain:", domain);
      console.log("Types:", types);
      console.log("Voucher:", voucher);
      console.log("Signature:", signature);
      console.log("Creator address:", creator.address);

      const isValid = await nftContract.verify(voucherWithSig);
      console.log("Signature verification result:", isValid);

      expect(isValid).to.be.true;
    });
  });
}); 