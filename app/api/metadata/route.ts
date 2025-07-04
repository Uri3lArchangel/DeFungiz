// app/api/metadata/route.ts
import { NextResponse } from 'next/server';
import NFT from '@/models/NFT';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import { INFT } from '@/declaration';

export async function GET(request: Request) {
  await mongoose.connect(process.env.MONGODB_URI as string);

  try {
    const { searchParams } = new URL(request.url);
    const tokenID = searchParams.get('tokenID');

    // Validate tokenID parameter
    if (!tokenID ) {
      return NextResponse.json(
        { error: 'Invalid or missing tokenID parameter' },
        { status: 400 }
      );
    }

    // Convert to MongoDB ObjectId
    const objectId = new ObjectId(BigInt(tokenID).toString(16));

    // Find NFT in database
    const nft = (await NFT.findById(objectId).lean()) as unknown as INFT;

    if (!nft) {
      return NextResponse.json(
        { error: 'NFT not found' },
        { status: 404 }
      );
    }

    // Format standard metadata response
    const metadata = {
      name: nft.name,
      description: nft.description,
      image: nft.assetUrl,
      external_url: `${process.env.BASE_URL}/nft/${nft._id}`,
      attributes: nft.attributes?.map((attr: any) => ({
        trait_type: attr.trait,
        value: attr.value
      })) || [],
      properties: {
        collection: nft.collection?.toString(),
        creator: nft.creator,
        owner: nft.owner,
        royalty: nft.royalty,
        // Include any other relevant properties
      }
    };

    // Cache control headers (adjust as needed)
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600' // 1 hour cache
    };

    return NextResponse.json(metadata, { headers });
  } catch (error) {
    console.error('Metadata fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}