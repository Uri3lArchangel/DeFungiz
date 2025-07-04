// app/api/collections/owned/route.ts
import { NextResponse } from 'next/server';
import Collection from '@/models/Collection';
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
    const owner = searchParams.get('owner');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!owner) {
      return NextResponse.json(
        { error: 'Owner address is required' },
        { status: 400 }
      );
    }

    // Fetch collections
    const [collections, total] = await Promise.all([
      Collection.find({ owner: owner.toLowerCase() })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Collection.countDocuments({ owner: owner.toLowerCase() })
    ]);

    return NextResponse.json({
      success: true,
      collections,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Error fetching owned collections:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch collections',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}