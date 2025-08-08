import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import dbConnect from '@/lib/dbConnect';
import NFT from '@/models/NFT';
import Collection from '@/models/Collection';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import { createOrGetUser } from '@/lib/user';

// Import contract ABIs from artifacts
import NFTContract721ABI from '../../../../contracts/artifacts/src/NFTContract721.sol/DeFungizNFTContract.json';
import NFTContract1155ABI from '../../../../contracts/artifacts/src/NFTContract1155.sol/DeFungizNFTCollectionContract.json';
import MarketplaceABI from '../../../../contracts/artifacts/src/NFTMarketplace.sol/DeFungizMarketplace.json';

// Contract addresses from deployment
const CONTRACT_ADDRESSES = {
  NFT_721: process.env.NFT_CONTRACT_721_ADDRESS || "0x391342f5acAcaaC9DE1dC4eC3E03f2678f7c78F1",
  NFT_1155: process.env.NFT_CONTRACT_1155_ADDRESS || "0x6d925938Edb8A16B3035A4cF34FAA090f490202a",
  MARKETPLACE: process.env.MARKETPLACE_CONTRACT_ADDRESS || "0xED8CAB8a931A4C0489ad3E3FB5BdEA84f74fD23E"
};


export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { 
      nftId,
      price,
      seller,
      listingType = 'fixed', // 'fixed' or 'auction'
      auctionDuration = 3600, // 1 hour default
      startingPrice = null, // For auctions
      signature, // Signature from client side
      voucher // Voucher data from client side
    } = body;

    if (!nftId || !price || !seller || !signature || !voucher) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: nftId, price, seller, signature, and voucher are required' },
        { status: 400 }
      );
    }

    // Create or get user by seller address
    const user = await createOrGetUser(seller);

    // Find the NFT in database
    const nft = await NFT.findById(nftId);
    if (!nft) {
      return NextResponse.json(
        { success: false, error: 'NFT not found' },
        { status: 404 }
      );
    }

    // Check if NFT is already listed
    if (nft.isListed) {
      return NextResponse.json(
        { success: false, error: 'NFT is already listed' },
        { status: 400 }
      );
    }

    // Determine contract address based on NFT type
    const contractAddress = nft.collection ? CONTRACT_ADDRESSES.NFT_1155 : CONTRACT_ADDRESSES.NFT_721;
    const contractABI = nft.collection ? NFTContract1155ABI.abi : NFTContract721ABI.abi;

    let listingData: any;
    let transactionType: string;

    if (listingType === 'fixed') {
      listingData = {
        type: 'fixed',
        price: parseFloat(price),
        voucher: {
          ...voucher,
          signature
        }
      };

      transactionType = 'lazy_list';

    } else if (listingType === 'auction') {
      // Create auction listing voucher
      const auctionPrice = startingPrice || price;
      
      listingData = {
        type: 'auction',
        startingPrice: parseFloat(auctionPrice),
        duration: auctionDuration,
        voucher: {
          ...voucher,
          signature
        }
      };

      transactionType = 'lazy_auction';
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid listing type. Must be "fixed" or "auction"' },
        { status: 400 }
      );
    }

    // Update NFT in database
    const updatedNFT = await NFT.findByIdAndUpdate(
      nftId,
      {
        isListed: true,
        price: listingData.price || listingData.startingPrice,
        auctionDetails: listingType === 'auction' ? {
          startingPrice: listingData.startingPrice,
          startTime: new Date(),
          endTime: new Date(Date.now() + (auctionDuration * 1000)),
          bids: []
        } : undefined,
        $push: {
          history: {
            eventType: listingType === 'auction' ? 'auction_created' : 'listing_created',
            from: seller,
            to: 'marketplace',
            price: listingData.price || listingData.startingPrice,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );

    // Create transaction record
    await Transaction.create({
      type: transactionType,
      nft: nftId,
      user: seller.toLowerCase(),
      amount: listingData.price || listingData.startingPrice,
      status: 'pending',
      txHash: `${transactionType}_${nftId}_${Date.now()}`,
      metadata: {
        listingData,
        contractAddress,
        contractABI,
        nftContract: contractAddress
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        walletAddress: user.walletAddress
      },
      nft: updatedNFT,
      listing: listingData,
      contractAddress,
      contractABI
    });

  } catch (error) {
    console.error('Lazy list error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create lazy listing',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 