import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import NFT from '@/models/NFT';


// Function to lazy mint NFTs   

export async function POST(request: NextRequest) {
    const { nftContract, tokenId, price, metadata } = await request.json();

    // Create metadata for the NFT
    const nft = await NFT.create({
        collection: nftContract,
        tokenId: tokenId,
        price: price,
        metadata: metadata
    });
    


}

