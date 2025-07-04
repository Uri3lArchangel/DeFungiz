import { NextResponse } from 'next/server';
import Collection from '@/models/Collection';
import connectDB from '@/lib/dbConnect';

export async function GET(request: Request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const creator = searchParams.get('creator');
    
    if (!creator) {
      return NextResponse.json(
        { success: false, error: 'Creator address is required' },
        { status: 400 }
      );
    }

    const collections = await Collection.find({ creator })
      .sort({ createdAt: -1 })
      .select('name _id previewImage');

    return NextResponse.json({ success: true, collections });
  } catch (error) {
    console.error('Failed to fetch collections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}