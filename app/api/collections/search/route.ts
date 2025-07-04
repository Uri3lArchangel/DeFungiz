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
    const query = searchParams.get('query') || '';
    const limit = parseInt(searchParams.get('limit') || '4');

    // Build filter
    const filter: any = {};
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }

    // Fetch top collections by volume
    const collections = await Collection.find(filter)
      .sort({ 'stats.totalVolume': -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ collections });
  } catch (error) {
    console.error('Collection search error:', error);
    return NextResponse.json(
      { error: 'Failed to search collections' },
      { status: 500 }
    );
  }
}