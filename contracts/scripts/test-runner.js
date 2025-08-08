const { ethers } = require("hardhat");

async function runAllTests() {
  console.log("🧪 Running DeFungiz NFT Platform Tests\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  };

  // Test 1: Contract Deployment
  console.log("📦 Test 1: Contract Deployment");
  try {
    const [deployer, creator, buyer, seller] = await ethers.getSigners();
    
    const NFTContract721 = await ethers.getContractFactory("DeFungizNFTContract");
    const nftContract721 = await NFTContract721.deploy();
    await nftContract721.deployed();

    const NFTContract1155 = await ethers.getContractFactory("DeFungizNFTCollectionContract");
    const nftContract1155 = await NFTContract1155.deploy();
    await nftContract1155.deployed();

    const Marketplace = await ethers.getContractFactory("DeFungizMarketplace");
    const marketplace = await Marketplace.deploy();
    await marketplace.deployed();

    console.log("✅ All contracts deployed successfully");
    console.log(`   ERC721: ${nftContract721.address}`);
    console.log(`   ERC1155: ${nftContract1155.address}`);
    console.log(`   Marketplace: ${marketplace.address}`);
    
    testResults.passed++;
  } catch (error) {
    console.log("❌ Contract deployment failed:", error.message);
    testResults.failed++;
    testResults.errors.push({ test: "Contract Deployment", error: error.message });
  }
  testResults.total++;

  // Test 2: ERC721 Voucher Creation and Minting
  console.log("\n🎨 Test 2: ERC721 Voucher Creation and Minting");
  try {
    const [deployer, creator, buyer] = await ethers.getSigners();
    
    const NFTContract721 = await ethers.getContractFactory("DeFungizNFTContract");
    const nftContract721 = await NFTContract721.deploy();
    await nftContract721.deployed();

    // Create voucher
    const voucher = {
      tokenURI: "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/1.json",
      price: ethers.utils.parseEther("0.1"),
      nonce: 1,
      owner: creator.address
    };

    const domain = {
      name: "DeFungizNFTContract",
      version: "1",
      chainId: await ethers.provider.getNetwork().then(n => n.chainId),
      verifyingContract: nftContract721.address
    };

    const types = {
      NFTVoucher: [
        { name: "owner", type: "address" },
        { name: "tokenURI", type: "string" },
        { name: "price", type: "uint256" },
        { name: "nonce", type: "uint256" }
      ]
    };

    const signature = await creator._signTypedData(domain, types, voucher);
    const voucherWithSig = { ...voucher, signature };

    // Verify voucher
    const isValid = await nftContract721.verify(voucherWithSig);
    if (!isValid) throw new Error("Voucher verification failed");

    // Mint NFT
    const mintTx = await nftContract721.mintNFT(voucherWithSig, buyer.address);
    await mintTx.wait();

    const tokenId = 1;
    const owner = await nftContract721.ownerOf(tokenId);
    if (owner !== buyer.address) throw new Error("NFT ownership verification failed");

    console.log("✅ ERC721 voucher creation and minting successful");
    console.log(`   Token ID: ${tokenId}`);
    console.log(`   Owner: ${owner}`);
    
    testResults.passed++;
  } catch (error) {
    console.log("❌ ERC721 test failed:", error.message);
    testResults.failed++;
    testResults.errors.push({ test: "ERC721 Voucher Creation and Minting", error: error.message });
  }
  testResults.total++;

  // Test 3: ERC1155 Collection Creation and Minting
  console.log("\n🎨 Test 3: ERC1155 Collection Creation and Minting");
  try {
    const [deployer, creator, buyer] = await ethers.getSigners();
    
    const NFTContract1155 = await ethers.getContractFactory("DeFungizNFTCollectionContract");
    const nftContract1155 = await NFTContract1155.deploy();
    await nftContract1155.deployed();

    // Create voucher
    const voucher = {
      owner: creator.address,
      name: "Test Collection",
      description: "A test collection",
      baseURI: "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/collection/",
      amount: ethers.utils.parseEther("0.1"),
      nonce: 1
    };

    const domain = {
      name: "DeFungizNFTCollectionContract",
      version: "1",
      chainId: await ethers.provider.getNetwork().then(n => n.chainId),
      verifyingContract: nftContract1155.address
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

    const signature = await creator._signTypedData(domain, types, voucher);
    const voucherWithSig = { ...voucher, signature };

    // Verify voucher
    const isValid = await nftContract1155.verify(voucherWithSig, creator.address);
    if (!isValid) throw new Error("Voucher verification failed");

    // Mint collection
    const tokenURIs = [
      "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/collection/1.json",
      "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/collection/2.json"
    ];
    const amount = 2;

    const mintTx = await nftContract1155.mintNFTCollection(
      voucherWithSig,
      creator.address,
      buyer.address,
      tokenURIs,
      amount,
      { value: voucher.amount }
    );
    await mintTx.wait();

    const balance = await nftContract1155.balanceOf(buyer.address, 1);
    if (balance.toString() !== amount.toString()) throw new Error("Collection balance verification failed");

    console.log("✅ ERC1155 collection creation and minting successful");
    console.log(`   Collection ID: 1`);
    console.log(`   Tokens: ${tokenURIs.length}`);
    console.log(`   Balance: ${balance}`);
    
    testResults.passed++;
  } catch (error) {
    console.log("❌ ERC1155 test failed:", error.message);
    testResults.failed++;
    testResults.errors.push({ test: "ERC1155 Collection Creation and Minting", error: error.message });
  }
  testResults.total++;

  // Test 4: Marketplace Listing and Purchase
  console.log("\n🏪 Test 4: Marketplace Listing and Purchase");
  try {
    const [deployer, creator, buyer, seller] = await ethers.getSigners();
    
    // Deploy contracts
    const NFTContract721 = await ethers.getContractFactory("DeFungizNFTContract");
    const nftContract721 = await NFTContract721.deploy();
    await nftContract721.deployed();

    const Marketplace = await ethers.getContractFactory("DeFungizMarketplace");
    const marketplace = await Marketplace.deploy();
    await marketplace.deployed();

    // Mint NFT to seller
    const voucher = {
      tokenURI: "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/1.json",
      price: ethers.utils.parseEther("0.1"),
      nonce: 1,
      owner: creator.address
    };

    const domain = {
      name: "DeFungizNFTContract",
      version: "1",
      chainId: await ethers.provider.getNetwork().then(n => n.chainId),
      verifyingContract: nftContract721.address
    };

    const types = {
      NFTVoucher: [
        { name: "owner", type: "address" },
        { name: "tokenURI", type: "string" },
        { name: "price", type: "uint256" },
        { name: "nonce", type: "uint256" }
      ]
    };

    const signature = await creator._signTypedData(domain, types, voucher);
    const voucherWithSig = { ...voucher, signature };

    await nftContract721.mintNFT(voucherWithSig, seller.address);

    // Approve marketplace
    await nftContract721.connect(seller).setApprovalForAll(marketplace.address, true);

    // Create listing
    const listingPrice = ethers.utils.parseEther("0.5");
    const listingTx = await marketplace.connect(seller).createListing(1, nftContract721.address, listingPrice);
    await listingTx.wait();

    // Buy NFT
    const buyTx = await marketplace.connect(buyer).buyNFT(1, { value: listingPrice });
    await buyTx.wait();

    const owner = await nftContract721.ownerOf(1);
    if (owner !== buyer.address) throw new Error("NFT ownership transfer failed");

    console.log("✅ Marketplace listing and purchase successful");
    console.log(`   Listing Price: ${ethers.utils.formatEther(listingPrice)} ETH`);
    console.log(`   Final Owner: ${owner}`);
    
    testResults.passed++;
  } catch (error) {
    console.log("❌ Marketplace test failed:", error.message);
    testResults.failed++;
    testResults.errors.push({ test: "Marketplace Listing and Purchase", error: error.message });
  }
  testResults.total++;

  // Test 5: Auction Creation and Bidding
  console.log("\n🏪 Test 5: Auction Creation and Bidding");
  try {
    const [deployer, creator, buyer, seller, bidder] = await ethers.getSigners();
    
    // Deploy contracts
    const NFTContract721 = await ethers.getContractFactory("DeFungizNFTContract");
    const nftContract721 = await NFTContract721.deploy();
    await nftContract721.deployed();

    const Marketplace = await ethers.getContractFactory("DeFungizMarketplace");
    const marketplace = await Marketplace.deploy();
    await marketplace.deployed();

    // Mint NFT to seller
    const voucher = {
      tokenURI: "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/2.json",
      price: ethers.utils.parseEther("0.1"),
      nonce: 2,
      owner: creator.address
    };

    const domain = {
      name: "DeFungizNFTContract",
      version: "1",
      chainId: await ethers.provider.getNetwork().then(n => n.chainId),
      verifyingContract: nftContract721.address
    };

    const types = {
      NFTVoucher: [
        { name: "owner", type: "address" },
        { name: "tokenURI", type: "string" },
        { name: "price", type: "uint256" },
        { name: "nonce", type: "uint256" }
      ]
    };

    const signature = await creator._signTypedData(domain, types, voucher);
    const voucherWithSig = { ...voucher, signature };

    await nftContract721.mintNFT(voucherWithSig, seller.address);

    // Approve marketplace
    await nftContract721.connect(seller).setApprovalForAll(marketplace.address, true);

    // Create auction
    const startingPrice = ethers.utils.parseEther("0.3");
    const duration = 3600; // 1 hour
    const auctionTx = await marketplace.connect(seller).createAuction(nftContract721.address, 2, startingPrice, duration);
    await auctionTx.wait();

    // Place bid
    const bidAmount = ethers.utils.parseEther("0.4");
    const bidTx = await marketplace.connect(bidder).placeBid(1, { value: bidAmount });
    await bidTx.wait();

    console.log("✅ Auction creation and bidding successful");
    console.log(`   Starting Price: ${ethers.utils.formatEther(startingPrice)} ETH`);
    console.log(`   Bid Amount: ${ethers.utils.formatEther(bidAmount)} ETH`);
    
    testResults.passed++;
  } catch (error) {
    console.log("❌ Auction test failed:", error.message);
    testResults.failed++;
    testResults.errors.push({ test: "Auction Creation and Bidding", error: error.message });
  }
  testResults.total++;

  // Test Summary
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 Test Summary");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} ✅`);
  console.log(`Failed: ${testResults.failed} ❌`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

  if (testResults.errors.length > 0) {
    console.log("\n❌ Failed Tests:");
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}: ${error.error}`);
    });
  }

  if (testResults.failed === 0) {
    console.log("\n🎉 All tests passed! The contracts are working correctly.");
  } else {
    console.log("\n⚠️  Some tests failed. Please check the errors above.");
  }

  return testResults;
}

// Export for use in other scripts
module.exports = { runAllTests };

// Run if called directly
if (require.main === module) {
  runAllTests()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Test runner failed:", error);
      process.exit(1);
    });
} 