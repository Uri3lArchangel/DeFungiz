import { NextResponse } from 'next/server';
import NFT from '@/models/NFT';
import Collection from '@/models/Collection';
import mongoose from 'mongoose';


export interface ICollection extends mongoose.Document {
  name: string;
  description?: string;
  collectionType: 'homogeneous' | 'heterogeneous';
  assetType?: string;
  creator: string;
  previewImage: string;
  bannerImage?: string;
  royalty: number;
  stats: {
    floorPrice: number;
    totalItems: number;
    totalVolume: number;
  };
  nfts: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}


const connectDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI as string);
  }
};

export async function POST(req: Request) {
  await connectDB();
  
  try {
    const body = await req.json();
    const { type, data, creator } = body;
    const lowercaseCreator = creator.toLowerCase();

    if (type === 'single') {
      // Handle single NFT creation
      const { nftData } = data;
      
      let collectionId: string | null = null;
      
      if (nftData.collectionOption === 'existing' && nftData.existingCollection) {
        // Add to existing collection
        collectionId = nftData.existingCollection;
        
        // Update collection's updatedAt
        await Collection.findByIdAndUpdate(collectionId, { 
          updatedAt: new Date(),
          $inc: { 'stats.totalItems': 1 } // Increment NFT count
        });
      }
      
      // Create NFT
      const newNFT = new NFT({
        name: nftData.name,
        description: nftData.description,
        assetUrl: nftData.assetUrl,
        previewUrl: nftData.previewUrl || nftData.assetUrl,
        assetType: nftData.assetType,
        attributes: nftData.attributes || [],
        price: nftData.price || 0,
        royalty: nftData.royalty || 5,
        collection: collectionId,
        creator: lowercaseCreator,
        owner: lowercaseCreator,
        isListed: true
      });
      
      const savedNFT = await newNFT.save();
      
      // If added to collection, update collection's NFTs array
      if (collectionId) {
        await Collection.findByIdAndUpdate(collectionId, {
          $push: { nfts: savedNFT._id }
        });
      }
      
      return NextResponse.json({ success: true, nft: savedNFT });
      
    } else if (type === 'collection') {
      // Handle collection creation
      const { collectionData } = data;
      const { assets, previewUrls, commonAttributes, uniqueAttributes } = collectionData;
      
      // Create or update collection with proper typing
      let collection: ICollection;
      if (collectionData.createNewCollection) {
        // Create new collection
        collection = new Collection({
          name: collectionData.name,
          description: collectionData.description,
          collectionType: collectionData.collectionType,
          assetType: collectionData.collectionType === 'homogeneous' ? collectionData.assetType : 'mixed',
          creator: lowercaseCreator,
          previewImage: collectionData.collectionPreviewUrl,
          bannerImage: collectionData.collectionPreviewUrl,
          royalty: collectionData.royalty || 5,
          stats: {
            floorPrice: collectionData.floorPrice || 0,
            totalItems: assets.length,
            totalVolume: 0
          }
        });
        
        await collection.save();
      } else {
        // Use existing collection
        const existingCollection = await Collection.findById(collectionData.existingCollection);
        if (!existingCollection) {
          return NextResponse.json(
            { success: false, error: 'Collection not found' },
            { status: 404 }
          );
        }
        collection = existingCollection;
        
        // Update collection stats
        if (collection.stats) {
          collection.stats.totalItems += assets.length;
          if (collectionData.floorPrice) {
            collection.stats.floorPrice = collectionData.floorPrice;
          }
        }
        await collection.save();
      }
      
      // Create NFTs in batch with proper naming and attributes
      const nftsToCreate = assets.map((asset: any, index: number) => {
        // Combine common and unique attributes
        const allAttributes = [
          ...(commonAttributes || []).map((attr: any) => ({
            trait: attr.trait,
            value: attr.value,
            isCommon: true
          })),
          ...(uniqueAttributes[index] || []).map((attr: any) => ({
            trait: attr.trait,
            value: attr.value,
            isCommon: false
          }))
        ];
        
        return {
          name: `${collectionData.name} #${index + 1}`,
          description: collectionData.description,
          assetUrl: asset.url,
          previewUrl: previewUrls[index] || asset.url,
          assetType: collectionData.collectionType === 'homogeneous' 
            ? collectionData.assetType 
            : asset.type,
          attributes: allAttributes,
          price: collectionData.floorPrice || 0,
          royalty: collectionData.royalty || 5,
          collection: collection._id,
          creator: lowercaseCreator,
          owner: lowercaseCreator,
          isListed: true
        };
      });
      
      const createdNFTs = await NFT.insertMany(nftsToCreate);
      
      // Update collection with new NFTs
      await Collection.findByIdAndUpdate(collection._id, {
        $push: { nfts: { $each: createdNFTs.map(nft => nft._id) } },
        updatedAt: new Date()
      });
      
      return NextResponse.json({ 
        success: true, 
        collection: collection,
        nfts: createdNFTs 
      });
    }
    
    return NextResponse.json({ success: false, error: 'Invalid creation type' }, { status: 400 });
    
  } catch (error) {
    console.error('Creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}