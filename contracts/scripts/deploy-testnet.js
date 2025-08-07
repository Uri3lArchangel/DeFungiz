const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting DeFungiz NFT Platform testnet deployment...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📋 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH\n");

  // Check if we have enough balance
  const balance = await deployer.getBalance();
  const minBalance = ethers.utils.parseEther("0.1"); // Minimum 0.1 ETH for deployment
  
  if (balance.lt(minBalance)) {
    console.error("❌ Insufficient balance for deployment. Need at least 0.1 ETH");
    console.log("Current balance:", ethers.utils.formatEther(balance), "ETH");
    process.exit(1);
  }

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

  // Wait for a few blocks to ensure deployment is confirmed
  console.log("\n⏳ Waiting for deployment confirmation...");
  await ethers.provider.waitForTransaction(marketplace.deployTransaction.hash, 3);

  console.log("\n🎉 All contracts deployed successfully!");
  console.log("\n📊 Deployment Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("│ Contract Type        │ Address                    │");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`│ ERC721 NFT Contract  │ ${nftContract721.address} │`);
  console.log(`│ ERC1155 Collection   │ ${nftContract1155.address} │`);
  console.log(`│ NFT Marketplace      │ ${marketplace.address}     │`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Get network info
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? `Chain ID ${network.chainId}` : network.name;
  
  console.log(`\n🌐 Network: ${networkName}`);
  console.log(`🔗 Explorer: ${getExplorerUrl(network.chainId)}`);

  // Save deployment addresses
  const deploymentInfo = {
    network: networkName,
    chainId: network.chainId,
    deployer: deployer.address,
    contracts: {
      nftContract721: nftContract721.address,
      nftContract1155: nftContract1155.address,
      marketplace: marketplace.address
    },
    timestamp: new Date().toISOString(),
    explorer: getExplorerUrl(network.chainId)
  };

  const filename = `deployment-${network.chainId}.json`;
  require('fs').writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to ${filename}`);

  // Verify contracts on Etherscan
  console.log("\n🔍 Verifying contracts on Etherscan...");
  
  const contracts = [
    { name: "ERC721 NFT Contract", address: nftContract721.address, args: [] },
    { name: "ERC1155 NFT Collection Contract", address: nftContract1155.address, args: [] },
    { name: "NFT Marketplace Contract", address: marketplace.address, args: [] }
  ];

  for (const contract of contracts) {
    try {
      console.log(`Verifying ${contract.name}...`);
      await hre.run("verify:verify", {
        address: contract.address,
        constructorArguments: contract.args,
      });
      console.log(`✅ ${contract.name} verified on Etherscan`);
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log(`✅ ${contract.name} already verified on Etherscan`);
      } else {
        console.log(`⚠️  ${contract.name} verification failed:`, error.message);
      }
    }
    
    // Wait between verifications to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log("\n🎯 Next Steps:");
  console.log("1. Test the contracts with the provided test scripts");
  console.log("2. Update your frontend with the contract addresses");
  console.log("3. Configure your marketplace settings");
  console.log("4. Start minting and trading NFTs!");
  console.log(`5. View contracts on explorer: ${getExplorerUrl(network.chainId)}`);
}

function getExplorerUrl(chainId) {
  const explorers = {
    1: "https://etherscan.io",
    5: "https://goerli.etherscan.io",
    11155111: "https://sepolia.etherscan.io",
    137: "https://polygonscan.com",
    80001: "https://mumbai.polygonscan.com",
    42161: "https://arbiscan.io",
    421613: "https://goerli.arbiscan.io",
    10: "https://optimistic.etherscan.io",
    420: "https://goerli-optimism.etherscan.io",
    56: "https://bscscan.com",
    97: "https://testnet.bscscan.com"
  };
  
  return explorers[chainId] || `https://explorer.chainid ${chainId}`;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 