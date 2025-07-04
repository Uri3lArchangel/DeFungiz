import Web3 from "web3";
import NFTMarketplaceABI from "./NFTMarketplaceABI.json";

const MARKETPLACE_ADDRESS = "0x6D91bFDF7A85ca8AA202564115fdf342279EbCB4";

export async function purchaseNFT(
  nftId: string,
  price: number, // Price in ETH (e.g., 0.1 for 0.1 ETH)
  owner: string,
  creator: string,
  royalty: number
) {
  try {
    // 1. Verify and initialize Web3 provider
    if (!window.ethereum) {
      throw new Error("MetaMask not installed");
    }

    const web3 = new Web3(window.ethereum);

    // 2. Request account access
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts"
    });
    
    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts available");
    }
    
    const buyerAddress = accounts[0];

    // 3. PROPERLY Prepare transaction value
    // Convert price to string with fixed decimals to avoid floating point issues
    const priceString = price.toFixed(18); // Handle up to 18 decimal places
    const priceInWei = web3.utils.toWei(priceString, "ether");
    console.log(`Converting ${price} ETH to wei:`, priceInWei); // Debug log

    const tID = BigInt(`0x${nftId}`).toString();

    // 4. Initialize contract
    const marketplace = new web3.eth.Contract(
      NFTMarketplaceABI.output.abi,
      MARKETPLACE_ADDRESS
    );

    // 5. Execute transaction with exact value
    const txHash = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [{
        from: buyerAddress,
        to: MARKETPLACE_ADDRESS,
        value: web3.utils.numberToHex(priceInWei), // Proper hex conversion
        data: marketplace.methods.buyNFT(
          tID,
          `${window.location.origin}/api/metadata?tokenID=${tID}`,
          owner,
          Math.round(royalty * 100), // Ensure whole number for basis points
          creator
        ).encodeABI()
      }]
    }).catch(error => {
      if (error.code === 4001) {
        throw new Error("Transaction rejected by user");
      }
      throw new Error(`Transaction failed: ${error.message}`);
    });

    // 6. Update backend
    const response = await fetch("/api/nfts/purchase", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nftId,
        buyerAddress,
        transactionHash: txHash,
        price: priceString, // Send the exact price string used
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to update backend");
    }

    return {
      success: true,
      transactionHash: txHash,
      data: await response.json(),
    };

  } catch (error) {
    console.error("Purchase failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Transaction failed",
      isUserRejected: error instanceof Error && error.message === "Transaction rejected by user"
    };
  }
}