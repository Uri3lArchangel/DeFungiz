
  export interface UserProfile {
    walletAddress: string;
    username: string;
    stats: {
      nftCount: number;
      collectionCount: number;
    };
    createdAt: Date;
    updatedAt: Date;
  }
  
  interface Attribute {
    trait: string;
    value: string;
  }
  
  interface Bid {
    bidder: string;
    amount: number;
    timestamp: Date;
  }
  
  interface HistoryEvent {
    eventType: string;
    from: string;
    to: string;
    price: number;
    timestamp: Date;
  }
  
  interface AuctionDetails {
    startingPrice?: number;
    reservePrice?: number;
    startTime?: Date;
    endTime?: Date;
    bids?: Bid[];
  }
  
 export interface INFT {
    _id: mongoose.Types.ObjectId;
    collection: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    assetUrl: string;
    previewUrl?: string;
    assetType: 'image' | 'video' | 'audio' | '3d' | 'inft';
    creator: string;
    owner: string;
    attributes?: Attribute[];
    price?: number;
    royalty?: number;
    isListed?: boolean;
    auctionDetails?: AuctionDetails;
    history?: HistoryEvent[];
    createdAt?: Date;
    updatedAt?: Date;
  }
  