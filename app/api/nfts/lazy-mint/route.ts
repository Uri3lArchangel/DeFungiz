import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import dbConnect from '@/lib/dbConnect';
import NFT from '@/models/NFT';
import Collection from '@/models/Collection';
import Transaction from '@/models/Transaction';
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

/**
 * Create or get user by wallet address
 */


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
      type, // 'erc721' or 'erc1155'
      uriId,
      metadata,
      price,
      creator,
      collectionId,
      tokenURIs = [], // For ERC1155 collections
      amount = 1, // For ERC1155 collections
      signature, // Signature from client side
      voucher // Voucher data from client side
    } = body;

    if (!creator || !metadata || !price || !signature || !voucher) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: creator, metadata, price, signature, and voucher are required' },
        { status: 400 }
      );
    }

    // Create or get user by creator address
    const user = await createOrGetUser(creator);

    let contractAddress: string;
    let contractType: string;
    let contractABI: any;

    if (type === 'erc721') {
      contractAddress = CONTRACT_ADDRESSES.NFT_721;
      contractType = 'erc721';
      contractABI = NFTContract721ABI.abi;

      // Create NFT in database
      const nft = new NFT({
        uriId: uriId,
        name: metadata.name || `DeFungiz NFT #${uriId}`,
        description: metadata.description || `DeFungiz NFT #${uriId}`,
        assetUrl: metadata.image || metadata.assetUrl || `https://via.placeholder.com/150`,
        assetType: metadata.assetType || 'image',
        creator: user._id,
        owner: user._id,
        price: parseFloat(price),
        royalty: metadata.royalty || 5,
        attributes: metadata.attributes || [],
        isListed: false, // Not listed yet, just lazy minted
        metadata: metadata,
        tokenURI: voucher.tokenURI || `https://via.placeholder.com/150`,
        collection: collectionId || null,
        voucher: voucher
      });

      const savedNFT = await nft.save();

      // Create transaction record
      await Transaction.create({
        type: 'lazy_mint',
        nft: savedNFT._id,
        user: creator.toLowerCase(),
        amount: parseFloat(price),
        status: 'completed',
        txHash: `lazy_mint_${savedNFT._id}`,
        metadata: {
          voucher: {
            ...voucher,
            signature
          },
          contractAddress,
          contractType: 'erc721',
          contractABI: contractABI
        }
      });

      return NextResponse.json({
        success: true,
        user: {
          id: user._id,
          username: user.username,
          walletAddress: user.walletAddress
        },
        nft: savedNFT,
        voucher: {
          ...voucher,
          signature
        },
        metadataURI: voucher.tokenURI || `https://via.placeholder.com/150`,
        contractAddress,
        contractABI
      });

    } else if (type === 'erc1155') {
      contractAddress = CONTRACT_ADDRESSES.NFT_1155;
      contractType = 'erc1155';
      contractABI = NFTContract1155ABI.abi;

      // Create collection in database if it doesn't exist
      let collection;
      if (collectionId) {
        collection = await Collection.findById(collectionId);
      } else {
        collection = new Collection({
          uriId: uriId,
          name: metadata.name || `DeFungiz Collection #${uriId}`,
          amount: amount,
          description: metadata.description || `DeFungiz Collection #${uriId}`,
          creator: creator.toLowerCase(),
          previewImage: metadata.image || metadata.previewUrl || `https://via.placeholder.com/150`,
          collectionType: 'homogeneous',
          assetType: metadata.assetType || 'image',
          floorPrice: parseFloat(price),
          metadata: metadata,
          voucher: voucher
        });
        await collection.save();
      }

      // Create NFTs in database
      const nftsToCreate = tokenURIs.map((tokenURI: string, index: number) => ({
        name: `${metadata.name || `DeFungiz NFT #${uriId}`} #${index + 1}`,
        description: metadata.description || `DeFungiz NFT #${uriId} #${index + 1}`,
        assetUrl: tokenURI || `https://via.placeholder.com/150`,
        previewUrl: tokenURI || `https://via.placeholder.com/150`,
        assetType: metadata.assetType || 'image',
        creator: creator.toLowerCase(),
        owner: creator.toLowerCase(),
        price: parseFloat(price),
        royalty: metadata.royalty || 5,
        attributes: metadata.attributes || [],
        isListed: false,
        metadata: metadata,
        tokenURI: tokenURI || `https://via.placeholder.com/150`,
        collection: collection._id,
        voucher: voucher
      }));

      const savedNFTs = await NFT.insertMany(nftsToCreate);

      // Update collection with NFTs
      await Collection.findByIdAndUpdate(collection._id, {
        $push: { nfts: { $each: savedNFTs.map(nft => nft._id) } },
        // Update the amount of NFTs in the collection
        $inc: { amount: tokenURIs.length }
      });

      // Create transaction record
      await Transaction.create({
        type: 'lazy_mint_collection',
        collection: collection._id,
        user: creator.toLowerCase(),
        amount: parseFloat(price) * tokenURIs.length,
        status: 'completed',
        txHash: `lazy_mint_collection_${collection._id}`,
        metadata: {
          voucher: {
            ...voucher,
            signature
          },
          contractAddress,
          contractType: 'erc1155',
          contractABI: contractABI,
          tokenCount: tokenURIs.length
        }
      });

      return NextResponse.json({
        success: true,
        user: {
          id: user._id,
          username: user.username,
          walletAddress: user.walletAddress
        },
        collection,
        nfts: savedNFTs,
        voucher: {
          ...voucher,
          signature
        },
        metadataURI: voucher.tokenURI || `https://via.placeholder.com/150`,
        contractAddress,
        contractABI
      });

    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid type. Must be "erc721" or "erc1155"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Lazy mint error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to lazy mint NFT',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

