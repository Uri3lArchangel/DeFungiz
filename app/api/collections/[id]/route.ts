import { NextResponse } from 'next/server';
import Collection from '@/models/Collection';
import connectDB from '@/lib/dbConnect';
import { isValidObjectId } from 'mongoose';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    
    // Validate ObjectID format
    if (!isValidObjectId((await params).id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid collection ID format' },
        { status: 400 }
      );
    }

    const collection = await Collection.findById((await params).id)
      .populate({
        path: 'nfts',
        select: 'name description assetUrl previewUrl assetType price isListed creator owner',
        options: { sort: { createdAt: -1 } }
      });

    if (!collection) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: collection });
  } catch (error) {
    console.error('Failed to fetch collection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch collection' },
      { status: 500 }
    );
  }
}