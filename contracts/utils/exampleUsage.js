const { ethers } = require("hardhat");
const VoucherUtils = require("./voucherUtils");
const MarketplaceUtils = require("./marketplaceUtils");

async function main() {
  console.log("🎯 DeFungiz NFT Platform - Example Usage\n");

  // Get signers
  const [deployer, creator, buyer, seller] = await ethers.getSigners();
  
  // Deploy contracts
  console.log("📦 Deploying contracts...");
  
  const NFTContract721 = await ethers.getContractFactory("DeFungizNFTContract");
  const nftContract721 = await NFTContract721.deploy();
  await nftContract721.deployed();

  const NFTContract1155 = await ethers.getContractFactory("DeFungizNFTCollectionContract");
  const nftContract1155 = await NFTContract1155.deploy();
  await nftContract1155.deployed();

  const Marketplace = await ethers.getContractFactory("DeFungizMarketplace");
  const marketplace = await Marketplace.deploy();
  await marketplace.deployed();

  console.log("✅ Contracts deployed successfully!\n");

  // Initialize utilities
  const voucherUtils = new VoucherUtils(nftContract721.address, await ethers.provider.getNetwork().then(n => n.chainId));
  const marketplaceUtils = new MarketplaceUtils(marketplace, nftContract721, nftContract1155);

  // Example 1: Create and mint ERC721 NFT with voucher
  console.log("🎨 Example 1: Creating ERC721 NFT with voucher");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  const erc721Voucher = await voucherUtils.createERC721Voucher(
    creator.address,
    "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/1.json",
    "0.1",
    voucherUtils.generateNonce(),
    creator
  );

  console.log("📝 Created ERC721 voucher:");
  console.log(`   Creator: ${erc721Voucher.owner}`);
  console.log(`   Token URI: ${erc721Voucher.tokenURI}`);
  console.log(`   Price: ${ethers.utils.formatEther(erc721Voucher.price)} ETH`);
  console.log(`   Nonce: ${erc721Voucher.nonce}`);

  // Verify voucher
  const isValidERC721 = await voucherUtils.verifyERC721Voucher(erc721Voucher, nftContract721);
  console.log(`   Signature Valid: ${isValidERC721}`);

  // Mint NFT
  const mintTx = await nftContract721.mintNFT(erc721Voucher, buyer.address);
  await mintTx.wait();
  console.log("✅ NFT minted successfully!");
  console.log(`   Token ID: 1`);
  console.log(`   Owner: ${buyer.address}\n`);

  // Example 2: Create and mint ERC1155 collection with voucher
  console.log("🎨 Example 2: Creating ERC1155 collection with voucher");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  const erc1155Voucher = await voucherUtils.createERC1155Voucher(
    creator.address,
    "Cool Collection",
    "A collection of cool NFTs",
    "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/collection/",
    "0.2",
    voucherUtils.generateNonce(),
    creator
  );

  console.log("📝 Created ERC1155 voucher:");
  console.log(`   Creator: ${erc1155Voucher.owner}`);
  console.log(`   Name: ${erc1155Voucher.name}`);
  console.log(`   Description: ${erc1155Voucher.description}`);
  console.log(`   Base URI: ${erc1155Voucher.baseURI}`);
  console.log(`   Price: ${ethers.utils.formatEther(erc1155Voucher.amount)} ETH`);

  // Verify voucher
  const isValidERC1155 = await voucherUtils.verifyERC1155Voucher(erc1155Voucher, creator.address, nftContract1155);
  console.log(`   Signature Valid: ${isValidERC1155}`);

  // Mint collection
  const tokenURIs = [
    "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/collection/1.json",
    "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/collection/2.json"
  ];
  const amount = 2;

  const collectionTx = await nftContract1155.mintNFTCollection(
    erc1155Voucher,
    creator.address,
    buyer.address,
    tokenURIs,
    amount,
    { value: erc1155Voucher.amount }
  );
  await collectionTx.wait();
  console.log("✅ Collection minted successfully!");
  console.log(`   Collection ID: 1`);
  console.log(`   Tokens: ${tokenURIs.length}`);
  console.log(`   Amount per token: ${amount}\n`);

  // Example 3: List NFT for sale
  console.log("🏪 Example 3: Listing NFT for sale");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  const listingResult = await marketplaceUtils.listERC721NFT("1", "0.5", buyer);
  
  if (listingResult.success) {
    console.log("✅ NFT listed successfully!");
    console.log(`   Listing ID: ${listingResult.listingId}`);
    console.log(`   Price: ${listingResult.price} ETH`);
    console.log(`   Transaction: ${listingResult.transactionHash}`);
  } else {
    console.log("❌ Failed to list NFT:", listingResult.error);
  }

  // Get listing details
  const listing = await marketplaceUtils.getListing(1);
  if (listing.success) {
    console.log("📋 Listing details:");
    console.log(`   Seller: ${listing.listing.seller}`);
    console.log(`   Token ID: ${listing.listing.tokenId}`);
    console.log(`   Price: ${listing.listing.price} ETH`);
    console.log(`   Active: ${listing.listing.isActive}\n`);
  }

  // Example 4: Buy NFT from listing
  console.log("🛒 Example 4: Buying NFT from listing");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  const buyResult = await marketplaceUtils.buyERC721NFT(1, "0.5", seller);
  
  if (buyResult.success) {
    console.log("✅ NFT purchased successfully!");
    console.log(`   Buyer: ${buyResult.buyer}`);
    console.log(`   Transaction: ${buyResult.transactionHash}`);
  } else {
    console.log("❌ Failed to buy NFT:", buyResult.error);
  }

  // Example 5: Create auction
  console.log("🏪 Example 5: Creating auction");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  // First, mint another NFT to seller
  const auctionVoucher = await voucherUtils.createERC721Voucher(
    creator.address,
    "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/2.json",
    "0.1",
    voucherUtils.generateNonce(),
    creator
  );
  
  await nftContract721.mintNFT(auctionVoucher, seller.address);
  
  const auctionResult = await marketplaceUtils.createAuction("2", "0.3", 3600, seller); // 1 hour duration
  
  if (auctionResult.success) {
    console.log("✅ Auction created successfully!");
    console.log(`   Auction ID: ${auctionResult.auctionId}`);
    console.log(`   Starting Price: ${auctionResult.startingPrice} ETH`);
    console.log(`   End Time: ${new Date(auctionResult.endTime * 1000).toLocaleString()}`);
  } else {
    console.log("❌ Failed to create auction:", auctionResult.error);
  }

  // Example 6: Place bid on auction
  console.log("🏪 Example 6: Placing bid on auction");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  const bidResult = await marketplaceUtils.placeBid(1, "0.4", buyer);
  
  if (bidResult.success) {
    console.log("✅ Bid placed successfully!");
    console.log(`   Bidder: ${bidResult.bidder}`);
    console.log(`   Amount: ${bidResult.bidAmount} ETH`);
  } else {
    console.log("❌ Failed to place bid:", bidResult.error);
  }

  // Example 7: Get marketplace statistics
  console.log("📊 Example 7: Marketplace statistics");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  const stats = await marketplaceUtils.getMarketplaceStats();
  if (stats.success) {
    console.log("📈 Marketplace stats:");
    console.log(`   Total Listings: ${stats.stats.totalListings}`);
    console.log(`   Total Auctions: ${stats.stats.totalAuctions}`);
    console.log(`   Listing Fee: ${stats.stats.listingFeePercent / 100}%`);
    console.log(`   Auction Fee: ${stats.stats.auctionFeePercent / 100}%\n`);
  }

  // Example 8: Get user's NFTs
  console.log("👤 Example 8: User's NFTs");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  const buyerTokens = await nftContract721.getTokenByOwner(buyer.address);
  console.log(`Buyer's ERC721 tokens: ${buyerTokens.length}`);
  buyerTokens.forEach((tokenId, index) => {
    console.log(`   Token ${index + 1}: ID ${tokenId}`);
  });

  const buyerBalance = await nftContract1155.balanceOf(buyer.address, 1);
  console.log(`Buyer's ERC1155 collection balance: ${buyerBalance} tokens\n`);

  console.log("🎉 Example usage completed successfully!");
  console.log("\n💡 Key Features Demonstrated:");
  console.log("   ✅ ERC721 NFT creation with vouchers");
  console.log("   ✅ ERC1155 collection creation with vouchers");
  console.log("   ✅ NFT listing and purchasing");
  console.log("   ✅ Auction creation and bidding");
  console.log("   ✅ Marketplace statistics");
  console.log("   ✅ User token management");
}

// Helper function to run examples
async function runExamples() {
  try {
    await main();
  } catch (error) {
    console.error("❌ Error running examples:", error);
  }
}

// Export for use in other scripts
module.exports = {
  main,
  runExamples
};

// Run if called directly
if (require.main === module) {
  runExamples();
} 