import { NextResponse } from "next/server";
import mongoose from "mongoose";
import User from "@/models/User";
import NFT from "@/models/NFT";
import Collection from "@/models/Collection";

const connectDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI as string);
  }
};

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    const lowercaseAddress = address.toLowerCase();
    // Fetch or create user profile
    let user = (await User.findOne({
      walletAddress: lowercaseAddress,
    }).lean()) as any;
    if (!user) {
      user = await User.create({
        walletAddress: lowercaseAddress,
        username: `user-${address.slice(2, 8)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Fetch all NFTs owned by this address
    const nfts = await NFT.find({ owner: lowercaseAddress })
      .populate({
        path: "collection",
        select: "name description logo bannerImage stats.floorPrice",
        options: { lean: true },
      })
      .select("name assetUrl previewUrl assetType price collection isListed")
      .lean();
    // Get collections created by this user
    const collections = await Collection.find({ creator: lowercaseAddress })
      .select("name logo stats.floorPrice")
      .lean();

    // Format response
    const response = {
      profile: {
        walletAddress: user!.walletAddress,
        username: user!.username,
        stats: {
          nftCount: nfts.length,
          collectionCount: collections.length,
        },
        createdAt: user!.createdAt,
        updatedAt: user!.updatedAt,
      },
      nfts: nfts.map((nft) => ({
        id: nft._id.toString(),
        name: nft.name,
        assetUrl: nft.assetUrl,
        previewUrl: nft.previewUrl || nft.assetUrl,
        assetType: nft.assetType,
        price: nft.price,
        isListed: nft.isListed,
        collection: nft.collection
          ? {
              id: nft.collection._id.toString(),
              name: nft.collection.name,
              logo: nft.collection.logo,
              floorPrice: nft.collection.stats?.floorPrice || 0,
            }
          : null,
      })),
      collections: collections.map((collection) => ({
        id: collection._id.toString(),
        name: collection.name,
        logo: collection.logo,
        floorPrice: collection.stats?.floorPrice || 0,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Profile API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile data" },
      { status: 500 }
    );
  }
}
