import { NextResponse } from "next/server";
import NFT from "@/models/NFT";
import mongoose from "mongoose";

const connectDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI as string);
  }
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid NFT ID format" },
        { status: 400 }
      );
    }

    const nft = await NFT.findById(id)
      .populate({
        path: "collection",
        select: "name description logo stats.floorPrice",
        options: {
          lean: true,
          strictPopulate: false,
        },
      })
      .lean();

    if (!nft) {
      return NextResponse.json(
        { success: false, error: "NFT not found" },
        { status: 404 }
      );
    }

    
    // Transform the data for the client
    const responseData = {
      ...nft,
      floorPrice: nft.collection?.stats?.floorPrice || 0,
      collectionPreview: nft.collection?.logo || null,
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching NFT:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch NFT",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
