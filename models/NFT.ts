import mongoose, { Schema } from 'mongoose';

const NFTSchema = new Schema({
  collection: { 
    type: Schema.Types.ObjectId,
    ref: 'Collection',
    index: true
  },
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String,
    trim: true
  },
  assetUrl: { 
    type: String,
    required: true
  },
  previewUrl: {
    type: String
  },
  assetType: { 
    type: String,
    enum: ['image', 'video', 'audio', '3d', 'inft'],
    required: true
  },
  creator: { 
    type: String, 
    required: true,
    lowercase:true
  },
  owner: { 
    type: String, 
    required: true,
    lowercase:true

  },
  attributes: [{
    trait: String,
    value: String
  }],
  price: {
    type: Number,
    min: 0
  }, 
  royalty: {
    type: Number,
    min: 0,
    max: 20,
    default: 5
  },
  isListed: {
    type: Boolean,
    default: true
  },
  auctionDetails: {
    startingPrice: Number,
    reservePrice: Number,
    startTime: Date,
    endTime: Date,
    bids: [{
      bidder: String,
      amount: Number,
      timestamp: Date
    }]
  },
  history: [{
    eventType: String,
    from: String,
    to: String,
    price: Number,
    timestamp: Date
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
},{ timestamps: true });

NFTSchema.post('save', async function(doc) {
  if (doc.collection) {
    const Collection = mongoose.model('Collection');
    await Collection.findByIdAndUpdate(doc.collection, {
      $addToSet: { nfts: doc._id }
    });
    // Update collection stats
    const collection = await Collection.findById(doc.collection);
    if (collection) {
      await collection.updateStats();
    }
  }
});

export default mongoose.models.NFT || mongoose.model('NFT', NFTSchema);