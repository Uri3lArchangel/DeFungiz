import mongoose, { Schema } from 'mongoose';

const CollectionSchema = new Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  description: { 
    type: String,
    trim: true,
    maxlength: 1000
  },
  nfts: [{
    type: Schema.Types.ObjectId,
    ref: 'NFT',
    default: []
  }],
 
  assetType: { 
    type: String,
    enum: ['image', 'video', 'audio', '3d', 'inft', 'mixed'],
    required: function() {
      return this.collectionType === 'homogeneous';
    }
  },
  creator: { 
    type: String, 
    required: true,
    index: true
  },
  previewImage: { 
    type: String,
    required: true
  },

    floorPrice: {
      type: Number,
      default: 0
    }
  }
 
, {
   
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strictPopulate: false // Add this to allow population even if no documents exist
});

// Update timestamps on save
CollectionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Update stats when NFTs are added/removed
CollectionSchema.methods.updateStats = async function() {
  const nftCount = await mongoose.model('NFT').countDocuments({ collection: this._id });
  this.stats.totalItems = nftCount;
  
  // You can add more complex stat calculations here
  return this.save();
};

export default mongoose.models.Collection || mongoose.model('Collection', CollectionSchema);