import { NextResponse } from 'next/server';
import NFT from '@/models/NFT';
import mongoose from 'mongoose';

const connectDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI as string);
  }
};

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const category = searchParams.get('category') || 'all';
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '1000000');
    const sort = searchParams.get('sort') || 'recent';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const isListed = searchParams.get('isListed') !== 'false'; // Default true

    // Validate inputs
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: 'Invalid page number' },
        { status: 400 }
      );
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Build filter
    const filter: any = {
    };

    // Text search
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }

    // Category filter
    if (category !== 'all') {
      filter.category = category;
    }

    // Price range filter
    filter.price = {
      $gte: minPrice,
      $lte: maxPrice
    };

    // Build sort options
    const sortOptions: Record<string, any> = {
      'price-low': { price: 1 },
      'price-high': { price: -1 },
      'popular': { views: -1, likes: -1 },
      'recent': { createdAt: -1 }
    };

    const sortOption = sortOptions[sort] || sortOptions.recent;

    // Fetch NFTs with collection data
    const [nfts, total] = await Promise.all([
      NFT.find(filter)
        .populate({
          path: 'collection',
          select: 'name stats.floorPrice previewImage',
          options: { strictPopulate: false } // Add this to handle schema flexibility
        })
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      NFT.countDocuments(filter)
    ]);

    // Transform data for client
    const transformedNfts = nfts.map(nft => ({
      ...nft,
      floorPrice: nft.collection?.stats?.floorPrice || 0,
      collectionPreview: nft.collection?.previewImage || null,
      collectionName: nft.collection?.name || null
    }));

    return NextResponse.json({
      success: true,
      nfts: transformedNfts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('NFT search error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to search NFTs',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}