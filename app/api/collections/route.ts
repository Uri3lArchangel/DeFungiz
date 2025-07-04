import { NextResponse } from 'next/server';
import Collection from '@/models/Collection';
import connectDB from '@/lib/dbConnect';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;
    const sort = searchParams.get('sort') || '-createdAt';
    const search = searchParams.get('search') || '';
    const creator = searchParams.get('creator');

    // Build the base query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (creator) {
      query.creator = creator;
    }

    // Handle different sort options
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'volume':
        sortOption = { 'stats.totalVolume': -1 };
        break;
      case 'floor':
        sortOption = { 'stats.floorPrice': -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Get total count for pagination
    const total = await Collection.countDocuments(query);

    // Fetch collections with pagination and sorting
    const collections = await Collection.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean();

    // If you need to populate NFTs, fetch them separately for better performance
    const collectionsWithNFTs = await Promise.all(
      collections.map(async (collection) => {
        const nfts = await mongoose.model('NFT').find(
          { collection: collection._id },
          'assetUrl previewUrl assetType price isListed',
          { limit: 4 }
        ).lean();

        return {
          ...collection,
          nfts,
          // Calculate floor price if not already set
          stats: {
            ...collection.stats,
            floorPrice: collection.stats?.floorPrice || 
              (nfts.length > 0 ? Math.min(...nfts.filter(n => n.isListed).map(n => n.price)) : 0)
          }
        };
      })
    );

    return NextResponse.json({ 
      success: true, 
      collections: collectionsWithNFTs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Failed to fetch collections:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch collections' 
      },
      { status: 500 }
    );
  }
}