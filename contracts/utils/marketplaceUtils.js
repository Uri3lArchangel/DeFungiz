const { ethers } = require("ethers");

class MarketplaceUtils {
  constructor(marketplaceContract, nftContract721, nftContract1155) {
    this.marketplace = marketplaceContract;
    this.nft721 = nftContract721;
    this.nft1155 = nftContract1155;
  }

  /**
   * List ERC721 NFT for sale
   * @param {string} tokenId - NFT token ID
   * @param {string} price - Price in ETH
   * @param {ethers.Signer} seller - Seller's signer
   * @returns {Object} Transaction result
   */
  async listERC721NFT(tokenId, price, seller) {
    try {
      // Approve marketplace to transfer NFT
      await this.nft721.connect(seller).setApprovalForAll(this.marketplace.address, true);
      
      // Create listing
      const tx = await this.marketplace.connect(seller).createListing(
        tokenId,
        this.nft721.address,
        ethers.utils.parseEther(price.toString())
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'ListingCreated');
      
      return {
        success: true,
        listingId: event.args.listingId,
        transactionHash: tx.hash,
        price: price
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Buy ERC721 NFT from listing
   * @param {number} listingId - Listing ID
   * @param {string} price - Price in ETH
   * @param {ethers.Signer} buyer - Buyer's signer
   * @returns {Object} Transaction result
   */
  async buyERC721NFT(listingId, price, buyer) {
    try {
      const tx = await this.marketplace.connect(buyer).buyNFT(
        listingId,
        { value: ethers.utils.parseEther(price.toString()) }
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'ListingPurchased');
      
      return {
        success: true,
        transactionHash: tx.hash,
        listingId: listingId,
        buyer: buyer.address
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create auction for ERC721 NFT
   * @param {string} tokenId - NFT token ID
   * @param {string} startingPrice - Starting price in ETH
   * @param {number} duration - Duration in seconds
   * @param {ethers.Signer} seller - Seller's signer
   * @returns {Object} Transaction result
   */
  async createAuction(tokenId, startingPrice, duration, seller) {
    try {
      // Approve marketplace to transfer NFT
      await this.nft721.connect(seller).setApprovalForAll(this.marketplace.address, true);
      
      // Create auction
      const tx = await this.marketplace.connect(seller).createAuction(
        this.nft721.address,
        tokenId,
        ethers.utils.parseEther(startingPrice.toString()),
        duration
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'AuctionCreated');
      
      return {
        success: true,
        auctionId: event.args.auctionId,
        transactionHash: tx.hash,
        startingPrice: startingPrice,
        endTime: event.args.endTime
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Place bid on auction
   * @param {number} auctionId - Auction ID
   * @param {string} bidAmount - Bid amount in ETH
   * @param {ethers.Signer} bidder - Bidder's signer
   * @returns {Object} Transaction result
   */
  async placeBid(auctionId, bidAmount, bidder) {
    try {
      const tx = await this.marketplace.connect(bidder).placeBid(
        auctionId,
        { value: ethers.utils.parseEther(bidAmount.toString()) }
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'BidPlaced');
      
      return {
        success: true,
        transactionHash: tx.hash,
        auctionId: auctionId,
        bidAmount: bidAmount,
        bidder: bidder.address
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * End auction
   * @param {number} auctionId - Auction ID
   * @param {ethers.Signer} caller - Caller's signer
   * @returns {Object} Transaction result
   */
  async endAuction(auctionId, caller) {
    try {
      const tx = await this.marketplace.connect(caller).endAuction(auctionId);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'AuctionEnded');
      
      return {
        success: true,
        transactionHash: tx.hash,
        auctionId: auctionId,
        winner: event.args.winner,
        finalBid: ethers.utils.formatEther(event.args.finalBid)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get listing details
   * @param {number} listingId - Listing ID
   * @returns {Object} Listing details
   */
  async getListing(listingId) {
    try {
      const listing = await this.marketplace.getListing(listingId);
      return {
        success: true,
        listing: {
          listingId: listing.listingId.toString(),
          seller: listing.seller,
          nftContract: listing.nftContract,
          tokenId: listing.tokenId.toString(),
          price: ethers.utils.formatEther(listing.price),
          isActive: listing.isActive,
          createdAt: new Date(listing.createdAt * 1000).toISOString(),
          updatedAt: new Date(listing.updatedAt * 1000).toISOString(),
          buyer: listing.buyer
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get auction details
   * @param {number} auctionId - Auction ID
   * @returns {Object} Auction details
   */
  async getAuction(auctionId) {
    try {
      const auction = await this.marketplace.getAuction(auctionId);
      return {
        success: true,
        auction: {
          auctionId: auction.auctionId.toString(),
          seller: auction.seller,
          nftContract: auction.nftContract,
          tokenId: auction.tokenId.toString(),
          startingPrice: ethers.utils.formatEther(auction.startingPrice),
          currentBid: ethers.utils.formatEther(auction.currentBid),
          currentBidder: auction.currentBidder,
          endTime: new Date(auction.endTime * 1000).toISOString(),
          isActive: auction.isActive,
          createdAt: new Date(auction.createdAt * 1000).toISOString(),
          updatedAt: new Date(auction.updatedAt * 1000).toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get active listings
   * @returns {Array} Array of active listing IDs
   */
  async getActiveListings() {
    try {
      const listingIds = await this.marketplace.getActiveListings();
      const listings = [];
      
      for (const listingId of listingIds) {
        const listing = await this.getListing(listingId);
        if (listing.success) {
          listings.push(listing.listing);
        }
      }
      
      return {
        success: true,
        listings: listings
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's listings
   * @param {string} userAddress - User's address
   * @returns {Array} Array of user's listing IDs
   */
  async getUserListings(userAddress) {
    try {
      const listingIds = await this.marketplace.getUserListings(userAddress);
      const listings = [];
      
      for (const listingId of listingIds) {
        const listing = await this.getListing(listingId);
        if (listing.success) {
          listings.push(listing.listing);
        }
      }
      
      return {
        success: true,
        listings: listings
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update listing price
   * @param {number} listingId - Listing ID
   * @param {string} newPrice - New price in ETH
   * @param {ethers.Signer} seller - Seller's signer
   * @returns {Object} Transaction result
   */
  async updateListingPrice(listingId, newPrice, seller) {
    try {
      const tx = await this.marketplace.connect(seller).updateListing(
        listingId,
        ethers.utils.parseEther(newPrice.toString())
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'ListingUpdated');
      
      return {
        success: true,
        transactionHash: tx.hash,
        listingId: listingId,
        newPrice: newPrice
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cancel listing
   * @param {number} listingId - Listing ID
   * @param {ethers.Signer} seller - Seller's signer
   * @returns {Object} Transaction result
   */
  async cancelListing(listingId, seller) {
    try {
      const tx = await this.marketplace.connect(seller).cancelListing(listingId);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'ListingCancelled');
      
      return {
        success: true,
        transactionHash: tx.hash,
        listingId: listingId
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get marketplace statistics
   * @returns {Object} Marketplace statistics
   */
  async getMarketplaceStats() {
    try {
      const totalListings = await this.marketplace.getTotalListings();
      const totalAuctions = await this.marketplace.getTotalAuctions();
      const listingFee = await this.marketplace.PLATFORM_LISTING_FEE_PERCENT();
      const auctionFee = await this.marketplace.PLATFORM_AUCTION_FEE_PERCENT();
      
      return {
        success: true,
        stats: {
          totalListings: totalListings.toString(),
          totalAuctions: totalAuctions.toString(),
          listingFeePercent: listingFee.toString(),
          auctionFeePercent: auctionFee.toString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if auction has ended
   * @param {number} auctionId - Auction ID
   * @returns {boolean} True if auction has ended
   */
  async isAuctionEnded(auctionId) {
    try {
      const auction = await this.marketplace.getAuction(auctionId);
      const currentTime = Math.floor(Date.now() / 1000);
      return currentTime >= auction.endTime;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get minimum bid for auction
   * @param {number} auctionId - Auction ID
   * @returns {string} Minimum bid amount in ETH
   */
  async getMinimumBid(auctionId) {
    try {
      const auction = await this.marketplace.getAuction(auctionId);
      const currentBid = auction.currentBid;
      const minIncrement = ethers.utils.parseEther("0.01"); // 0.01 ETH minimum increment
      const minBid = currentBid.add(minIncrement);
      return ethers.utils.formatEther(minBid);
    } catch (error) {
      return "0";
    }
  }
}

module.exports = MarketplaceUtils; 