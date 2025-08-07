const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting DeFungiz NFT Platform deployment...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📋 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH\n");

  // Deploy ERC721 NFT Contract
  console.log("📦 Deploying ERC721 NFT Contract...");
  const NFTContract721 = await ethers.getContractFactory("DeFungizNFTContract");
  const nftContract721 = await NFTContract721.deploy();
  await nftContract721.deployed();
  console.log("✅ ERC721 NFT Contract deployed to:", nftContract721.address);

  // Deploy ERC1155 NFT Collection Contract
  console.log("📦 Deploying ERC1155 NFT Collection Contract...");
  const NFTContract1155 = await ethers.getContractFactory("DeFungizNFTCollectionContract");
  const nftContract1155 = await NFTContract1155.deploy();
  await nftContract1155.deployed();
  console.log("✅ ERC1155 NFT Collection Contract deployed to:", nftContract1155.address);

  // Deploy Marketplace Contract
  console.log("📦 Deploying NFT Marketplace Contract...");
  const Marketplace = await ethers.getContractFactory("DeFungizMarketplace");
  const marketplace = await Marketplace.deploy();
  await marketplace.deployed();
  console.log("✅ NFT Marketplace Contract deployed to:", marketplace.address);

  console.log("\n🎉 All contracts deployed successfully!");
  console.log("\n📊 Deployment Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("│ Contract Type        │ Address                    │");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`│ ERC721 NFT Contract  │ ${nftContract721.address} │`);
  console.log(`│ ERC1155 Collection   │ ${nftContract1155.address} │`);
  console.log(`│ NFT Marketplace      │ ${marketplace.address}     │`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Save deployment addresses
  const deploymentInfo = {
    network: await ethers.provider.getNetwork().then(n => n.name),
    deployer: deployer.address,
    contracts: {
      nftContract721: nftContract721.address,
      nftContract1155: nftContract1155.address,
      marketplace: marketplace.address
    },
    timestamp: new Date().toISOString()
  };

  console.log("\n💾 Deployment info saved to deployment-info.json");
  require('fs').writeFileSync(
    'deployment-info.json', 
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Verify contracts on Etherscan (if not on local network)
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 31337) { // Not local network
    console.log("\n🔍 Verifying contracts on Etherscan...");
    
    try {
      await hre.run("verify:verify", {
        address: nftContract721.address,
        constructorArguments: [],
      });
      console.log("✅ ERC721 NFT Contract verified on Etherscan");
    } catch (error) {
      console.log("⚠️  ERC721 NFT Contract verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: nftContract1155.address,
        constructorArguments: [],
      });
      console.log("✅ ERC1155 NFT Collection Contract verified on Etherscan");
    } catch (error) {
      console.log("⚠️  ERC1155 NFT Collection Contract verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: marketplace.address,
        constructorArguments: [],
      });
      console.log("✅ NFT Marketplace Contract verified on Etherscan");
    } catch (error) {
      console.log("⚠️  NFT Marketplace Contract verification failed:", error.message);
    }
  }

  console.log("\n🎯 Next Steps:");
  console.log("1. Update your frontend with the contract addresses");
  console.log("2. Test the contracts with the provided test scripts");
  console.log("3. Configure your marketplace settings");
  console.log("4. Start minting and trading NFTs!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 