const { expect } = require("chai");
const { ethers } = require("hardhat");
const { parseEther, ZeroAddress } = ethers;

describe("DeFungizMarketplace", function () {
  let marketplace, nftContract721, nftContract1155;
  let owner, seller, buyer, bidder1, bidder2, addr1;

  beforeEach(async function () {
    [owner, seller, buyer, bidder1, bidder2, addr1, addr2] = await ethers.getSigners();
    
    const NFTContract721 = await ethers.getContractFactory("DeFungizNFTContract");
    nftContract721 = await NFTContract721.deploy();
    await nftContract721.waitForDeployment();
    
    const NFTContract1155 = await ethers.getContractFactory("DeFungizNFTCollectionContract");
    nftContract1155 = await NFTContract1155.deploy();
    await nftContract1155.waitForDeployment();
    
    const Marketplace = await ethers.getContractFactory("DeFungizMarketplace");
    marketplace = await Marketplace.deploy();
    await marketplace.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await marketplace.owner()).to.equal(owner.address);
    });

    it("Should start with 0 listings", async function () {
      expect(await marketplace.getTotalListings()).to.equal(0);
    });

    it("Should start with 0 auctions", async function () {
      expect(await marketplace.getTotalAuctions()).to.equal(0);
    });

    it("Should have correct default fees", async function () {
      expect(await marketplace.PLATFORM_LISTING_FEE_PERCENT()).to.equal(1000); // 10%
      expect(await marketplace.PLATFORM_AUCTION_FEE_PERCENT()).to.equal(1000); // 10%
    });
  });

  describe("NFT Listing", function () {
    let tokenId;

    beforeEach(async function () {
      // Mint an NFT to seller
      const voucher = {
        tokenURI: "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/1.json",
        price: parseEther("0.1"),
        nonce: 1,
        owner: seller.address
      };

      const domain = {
        name: "DeFungizNFTContract",
        version: "1",
        chainId: await ethers.provider.getNetwork().then(n => n.chainId),
        verifyingContract: nftContract721.target
      };

      const types = {
        NFTVoucher: [
          { name: "owner", type: "address" },
          { name: "tokenURI", type: "string" },
          { name: "price", type: "uint256" },
          { name: "nonce", type: "uint256" }
        ]
      };

      signature = await seller.signTypedData(domain, types, voucher);
      const voucherWithSig = { ...voucher, signature };

      await nftContract721.connect(seller).mintNFT(voucherWithSig, seller.address, { value: voucher.price });
      tokenId = 1;
    });

    it("Should create a listing", async function () {
      const price = parseEther("1");
      
      await nftContract721.connect(seller).setApprovalForAll(marketplace.target, true);
      
      await expect(marketplace.connect(seller).createListing(tokenId, nftContract721.target, price))
        .to.emit(marketplace, "ListingCreated")
        .withArgs(1, seller.address, nftContract721.target, tokenId, price);

      expect(await marketplace.getTotalListings()).to.equal(1);
      expect(await nftContract721.ownerOf(tokenId)).to.equal(marketplace.target);
    });

    it("Should reject listing if not owner", async function () {
      const price = parseEther("1");
      
      await expect(marketplace.connect(buyer).createListing(tokenId, nftContract721.target, price))
        .to.be.revertedWith("You cannot list NFT that you do not own");
    });

    it("Should reject listing without approval", async function () {
      const price = parseEther("1");
      
      await expect(marketplace.connect(seller).createListing(tokenId, nftContract721.target, price))
        .to.be.revertedWith("NFT must be approved for marketplace");
    });

    it("Should update listing price", async function () {
      const price = parseEther("1");
      const newPrice = parseEther("2");
      
      await nftContract721.connect(seller).setApprovalForAll(marketplace.target, true);
      await marketplace.connect(seller).createListing(tokenId, nftContract721.target, price);
      
      await expect(marketplace.connect(seller).updateListing(1, newPrice))
        .to.emit(marketplace, "ListingUpdated")
        .withArgs(1, newPrice);

      const listing = await marketplace.getListing(1);
      expect(listing.price).to.equal(newPrice);
    });

    it("Should reject price update by non-seller", async function () {
      const price = parseEther("1");
      const newPrice = parseEther("2");
      
      await nftContract721.connect(seller).setApprovalForAll(marketplace.target, true);
      await marketplace.connect(seller).createListing(tokenId, nftContract721.target, price);
      
      await expect(marketplace.connect(buyer).updateListing(1, newPrice))
        .to.be.revertedWith("Only the seller of the NFT can change the price");
    });

    it("Should buy NFT from listing", async function () {
      const price = parseEther("1");
      
      await nftContract721.connect(seller).setApprovalForAll(marketplace.target, true);
      await marketplace.connect(seller).createListing(tokenId, nftContract721.target, price);
      
      const initialBuyerBalance = await ethers.provider.getBalance(buyer.address);
      const initialSellerBalance = await ethers.provider.getBalance(seller.address);
      const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
      
      await expect(marketplace.connect(buyer).buyNFT(1, { value: price }))
        .to.emit(marketplace, "ListingPurchased")
        .withArgs(1, buyer.address, price);

      expect(await nftContract721.ownerOf(tokenId)).to.equal(buyer.address);
      
      // Check balances (platform fee is 10%)
      const platformFee = (price * 1000n) / 10000n; // 10%
      const sellerAmount = price - platformFee;
      
      expect(await ethers.provider.getBalance(seller.address)).to.equal(initialSellerBalance + sellerAmount);
      expect(await ethers.provider.getBalance(owner.address)).to.equal(initialOwnerBalance);
    });

    it("Should reject purchase with incorrect payment", async function () {
      const price = parseEther("1");
      
      await nftContract721.connect(seller).setApprovalForAll(marketplace.target, true);
      await marketplace.connect(seller).createListing(tokenId, nftContract721.target, price);
      
      await expect(marketplace.connect(buyer).buyNFT(1, { value: parseEther("0.5") }))
        .to.be.revertedWith("Incorrect payment amount");
    });

    it("Should reject purchase by seller", async function () {
      const price = parseEther("1");
      
      await nftContract721.connect(seller).setApprovalForAll(marketplace.target, true);
      await marketplace.connect(seller).createListing(tokenId, nftContract721.target, price);
      
      await expect(marketplace.connect(seller).buyNFT(1, { value: price }))
        .to.be.revertedWith("The seller cannot purchase the NFT");
    });

    it("Should cancel listing", async function () {
      const price = parseEther("1");
      
      await nftContract721.connect(seller).setApprovalForAll(marketplace.target, true);
      await marketplace.connect(seller).createListing(tokenId, nftContract721.target, price);
      
      await expect(marketplace.connect(seller).cancelListing(1))
        .to.emit(marketplace, "ListingCancelled")
        .withArgs(1);

      expect(await nftContract721.ownerOf(tokenId)).to.equal(seller.address);
      
      const listing = await marketplace.getListing(1);
      expect(listing.isActive).to.be.false;
    });

    it("Should reject cancellation by non-seller", async function () {
      const price = parseEther("1");
      
      await nftContract721.connect(seller).setApprovalForAll(marketplace.target, true);
      await marketplace.connect(seller).createListing(tokenId, nftContract721.target, price);
      
      await expect(marketplace.connect(buyer).cancelListing(1))
        .to.be.revertedWith("Only the seller of the NFT can change the price");
    });
  });

  describe("NFT Auctions", function () {
    let tokenId;

    beforeEach(async function () {
      // Mint an NFT to seller
      const voucher = {
        tokenURI: "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/1.json",
        price: parseEther("0.1"),
        nonce: 1,
        owner: seller.address
      };

      const domain = {
        name: "DeFungizNFTContract",
        version: "1",
        chainId: await ethers.provider.getNetwork().then(n => n.chainId),
        verifyingContract: nftContract721.target
      };

      const types = {
        NFTVoucher: [
          { name: "owner", type: "address" },
          { name: "tokenURI", type: "string" },
          { name: "price", type: "uint256" },
          { name: "nonce", type: "uint256" }
        ]
      };

      signature = await seller.signTypedData(domain, types, voucher);
      const voucherWithSig = { ...voucher, signature };

      await nftContract721.connect(seller).mintNFT(voucherWithSig, seller.address, { value: voucher.price });
      tokenId = 1;
    });

    it("Should create an auction", async function () {
      const startingPrice = parseEther("1");
      const duration = 3600; // 1 hour
      
      await nftContract721.connect(seller).setApprovalForAll(marketplace.target, true);
      
      await expect(marketplace.connect(seller).createAuction(nftContract721.target, tokenId, startingPrice, duration))
        .to.emit(marketplace, "AuctionCreated");

      expect(await marketplace.getTotalAuctions()).to.equal(1);
      expect(await nftContract721.ownerOf(tokenId)).to.equal(marketplace.target);
    });

    it("Should reject auction creation if not owner", async function () {
      const startingPrice = parseEther("1");
      const duration = 3600;
      
      await expect(marketplace.connect(buyer).createAuction(nftContract721.target, tokenId, startingPrice, duration))
        .to.be.revertedWith("You cannot mint NFT that you do not own");
    });

    it("Should reject auction with too short duration", async function () {
      const startingPrice = parseEther("1");
      const duration = 1800; // 30 minutes (less than 1 hour minimum)
      
      await nftContract721.connect(seller).setApprovalForAll(marketplace.target, true);
      
      await expect(marketplace.connect(seller).createAuction(nftContract721.target, tokenId, startingPrice, duration))
        .to.be.revertedWith("Duration time too short, it must be greater than or equal to 2 minutes");
    });

    it("Should place a bid", async function () {
      const startingPrice = parseEther("1");
      const duration = 3600;
      const bidAmount = parseEther("2");
      
      await nftContract721.connect(seller).setApprovalForAll(marketplace.target, true);
      await marketplace.connect(seller).createAuction(nftContract721.target, tokenId, startingPrice, duration);
      
      await expect(marketplace.connect(bidder1).placeBid(1, { value: bidAmount }))
        .to.emit(marketplace, "BidPlaced")
        .withArgs(1, bidder1.address, bidAmount);

      const auction = await marketplace.getAuction(1);
      expect(auction.currentBid).to.equal(bidAmount);
      expect(auction.currentBidder).to.equal(bidder1.address);
    });

    it("Should reject bid below starting price", async function () {
      const startingPrice = parseEther("1");
      const duration = 3600;
      const bidAmount = parseEther("0.5");
      
      await nftContract721.connect(seller).setApprovalForAll(marketplace.target, true);
      await marketplace.connect(seller).createAuction(nftContract721.target, tokenId, startingPrice, duration);
      
      await expect(marketplace.connect(bidder1).placeBid(1, { value: bidAmount }))
        .to.be.revertedWith("Bid must be at least the starting price");
    });

    it("Should reject bid by seller", async function () {
      const startingPrice = parseEther("1");
      const duration = 3600;
      const bidAmount = parseEther("2");
      
      await nftContract721.connect(seller).setApprovalForAll(marketplace.target, true);
      await marketplace.connect(seller).createAuction(nftContract721.target, tokenId, startingPrice, duration);
      
      await expect(marketplace.connect(seller).placeBid(1, { value: bidAmount }))
        .to.be.revertedWith("Seller cannot bid on their own auction");
    });

    it("Should end auction and transfer NFT to winner", async function () {
      const startingPrice = parseEther("1");
      const duration = 3600;
      const bidAmount = parseEther("2");
      
      await nftContract721.connect(seller).setApprovalForAll(marketplace.target, true);
      await marketplace.connect(seller).createAuction(nftContract721.target, tokenId, startingPrice, duration);
      await marketplace.connect(bidder1).placeBid(1, { value: bidAmount });
      
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");
      
      const initialSellerBalance = await ethers.provider.getBalance(seller.address);
      const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
      
      await expect(marketplace.connect(addr1).endAuction(1))
        .to.emit(marketplace, "AuctionEnded")
        .withArgs(1, bidder1.address, bidAmount);

      expect(await nftContract721.ownerOf(tokenId)).to.equal(bidder1.address);
      
      // Check balances (platform fee is 10%)
      const platformFee = (bidAmount * 1000n) / 10000n; // 10%
      const sellerAmount = bidAmount - platformFee;
      
      expect(await ethers.provider.getBalance(seller.address)).to.equal(initialSellerBalance + sellerAmount);
      expect(await ethers.provider.getBalance(owner.address)).to.equal(initialOwnerBalance);
    });

    it("Should return NFT to seller if no bids", async function () {
      const startingPrice = parseEther("1");
      const duration = 3600;
      
      await nftContract721.connect(seller).setApprovalForAll(marketplace.target, true);
      await marketplace.connect(seller).createAuction(nftContract721.target, tokenId, startingPrice, duration);
      
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");
      
      await expect(marketplace.connect(addr1).endAuction(1))
        .to.emit(marketplace, "AuctionEnded")
        .withArgs(1, ZeroAddress, 0);

      expect(await nftContract721.ownerOf(tokenId)).to.equal(seller.address);
    });

    it("Should cancel auction before any bids", async function () {
      const startingPrice = parseEther("1");
      const duration = 3600;
      
      await nftContract721.connect(seller).setApprovalForAll(marketplace.target, true);
      await marketplace.connect(seller).createAuction(nftContract721.target, tokenId, startingPrice, duration);
      
      await expect(marketplace.connect(seller).cancelAuction(1))
        .to.emit(marketplace, "AuctionCancelled")
        .withArgs(1);

      expect(await nftContract721.ownerOf(tokenId)).to.equal(seller.address);
    });

    it("Should reject auction cancellation with bids", async function () {
      const startingPrice = parseEther("1");
      const duration = 3600;
      const bidAmount = parseEther("2");
      
      await nftContract721.connect(seller).setApprovalForAll(marketplace.target, true);
      await marketplace.connect(seller).createAuction(nftContract721.target, tokenId, startingPrice, duration);
      await marketplace.connect(bidder1).placeBid(1, { value: bidAmount });
      
      await expect(marketplace.connect(seller).cancelAuction(1))
        .to.be.revertedWith("Cannot cancel auction with bids");
    });
  });

  describe("Platform Management", function () {
    it("Should update platform listing fee", async function () {
      const newFee = 500; // 5%
      
      await expect(marketplace.updatePlatformListtingFee(newFee))
        .to.emit(marketplace, "PlatformFeeListingUpdated")
        .withArgs(newFee);

      expect(await marketplace.PLATFORM_LISTING_FEE_PERCENT()).to.equal(newFee);
    });

    it("Should update platform auction fee", async function () {
      const newFee = 500; // 5%
      
      await expect(marketplace.updateAuctionFee(newFee))
        .to.emit(marketplace, "PlatformFeeAuctionUpdated")
        .withArgs(newFee);

      expect(await marketplace.PLATFORM_AUCTION_FEE_PERCENT()).to.equal(newFee);
    });

    it("Should reject fee update above 10%", async function () {
      const newFee = 1500; // 15%
      
      await expect(marketplace.updatePlatformListtingFee(newFee))
        .to.be.revertedWith("Platform fee cannot exceed 10%");
    });

    it("Should withdraw platform fees", async function () {
      // Create a listing and buy it to generate fees
      const voucher = {
        tokenURI: "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/1.json",
        price: parseEther("0.1"),
        nonce: 1,
        owner: seller.address
      };

      const domain = {
        name: "DeFungizNFTContract",
        version: "1",
        chainId: await ethers.provider.getNetwork().then(n => n.chainId),
        verifyingContract: nftContract721.target
      };

      const types = {
        NFTVoucher: [
          { name: "owner", type: "address" },
          { name: "tokenURI", type: "string" },
          { name: "price", type: "uint256" },
          { name: "nonce", type: "uint256" }
        ]
      };

      signature = await seller.signTypedData(domain, types, voucher);
      const voucherWithSig = { ...voucher, signature };

      await nftContract721.connect(seller).mintNFT(voucherWithSig, seller.address, { value: voucher.price });
      
      const price = parseEther("1");
      await nftContract721.connect(seller).setApprovalForAll(marketplace.target, true);
      await marketplace.connect(seller).createListing(1, nftContract721.target, price);
      await marketplace.connect(buyer).buyNFT(1, { value: price });

      const initialBalance = await ethers.provider.getBalance(owner.address);
      await expect(marketplace.connect(owner).withdrawFees())
        .to.emit(marketplace, "FeesWithdrawn");

      // Check that fees were actually withdrawn (balance should be higher)
      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should reject fee withdrawal by non-owner", async function () {
      await expect(marketplace.connect(owner).withdrawFees())
        .to.be.revertedWith("No fees to withdraw");
    });
  });

  describe("View Functions", function () {
    it("Should return active listings", async function () {
      // Create a listing
      const voucher = {
        tokenURI: "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/1.json",
        price: parseEther("0.1"),
        nonce: 1,
        owner: seller.address
      };

      const domain = {
        name: "DeFungizNFTContract",
        version: "1",
        chainId: await ethers.provider.getNetwork().then(n => n.chainId),
        verifyingContract: nftContract721.target
      };

      const types = {
        NFTVoucher: [
          { name: "owner", type: "address" },
          { name: "tokenURI", type: "string" },
          { name: "price", type: "uint256" },
          { name: "nonce", type: "uint256" }
        ]
      };

      signature = await seller.signTypedData(domain, types, voucher);
      const voucherWithSig = { ...voucher, signature };

      await nftContract721.connect(seller).mintNFT(voucherWithSig, seller.address, { value: voucher.price });
      
      const price = parseEther("1");
      await nftContract721.connect(seller).setApprovalForAll(marketplace.target, true);
      await marketplace.connect(seller).createListing(1, nftContract721.target, price);

      const activeListings = await marketplace.getActiveListings();
      expect(activeListings.length).to.equal(1);
      expect(activeListings[0]).to.equal(1);
    });

    it("Should return user listings", async function () {
      // Create a listing
      const voucher = {
        tokenURI: "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/1.json",
        price: parseEther("0.1"),
        nonce: 1,
        owner: seller.address
      };

      const domain = {
        name: "DeFungizNFTContract",
        version: "1",
        chainId: await ethers.provider.getNetwork().then(n => n.chainId),
        verifyingContract: nftContract721.target
      };

      const types = {
        NFTVoucher: [
          { name: "owner", type: "address" },
          { name: "tokenURI", type: "string" },
          { name: "price", type: "uint256" },
          { name: "nonce", type: "uint256" }
        ]
      };

      signature = await seller.signTypedData(domain, types, voucher);
      const voucherWithSig = { ...voucher, signature };

      await nftContract721.connect(seller).mintNFT(voucherWithSig, seller.address, { value: voucher.price });
      
      const price = parseEther("1");
      await nftContract721.connect(seller).setApprovalForAll(marketplace.target, true);
      await marketplace.connect(seller).createListing(1, nftContract721.target, price);

      const userListings = await marketplace.getUserListings(seller.address);
      expect(userListings.length).to.equal(1);
      expect(userListings[0]).to.equal(1);
    });
  });
}); 