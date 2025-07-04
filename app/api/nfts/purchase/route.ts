// app/api/nfts/purchase/route.ts
import { NextResponse } from 'next/server';
import NFT from '@/models/NFT';
import connectDB from '@/lib/dbConnect';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  try {
    const { nftId, buyerAddress, transactionHash, price } = await request.json();
    await connectDB();

    // Find and validate NFT
    const nft = await NFT.findById(new ObjectId(nftId));
    if (!nft || !nft.isListed) {
      return NextResponse.json(
        { success: false, error: 'NFT not available for purchase' },
        { status: 404 }
      );
    }
    console.log({nft})

    // Update NFT ownership and status
    nft.isListed = false;
    nft.owner = buyerAddress.toLowerCase();
    nft.price = price;

    // Add transaction to history
    nft.history.push({
      eventType: 'Purchase',
      from: nft.owner,
      to: buyerAddress,
      price: price,
      transactionHash: transactionHash,
      timestamp: new Date()
    });

    await nft.save();

    return NextResponse.json({
      success: true,
      message: 'NFT purchase recorded successfully',
      data: nft
    });
  } catch (error) {
    console.error('Failed to record purchase:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record purchase' },
      { status: 500 }
    );
  }
}