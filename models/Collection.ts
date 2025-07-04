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
  collectionType: {  // Add this field to your schema
    type: String,
    enum: ['homogeneous', 'heterogeneous'],
    default: 'homogeneous'
  },
  assetType: { 
    type: String,
    enum: ['image', 'video', 'audio', '3d', 'inft', 'mixed'],
    required: function(this: any) {  // Add type annotation for 'this'
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
}, {
  timestamps: true,  // Automatically adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strictPopulate: false
});

// Update timestamps on save
CollectionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Update stats when NFTs are added/removed
CollectionSchema.methods.updateStats = async function() {
  const nftCount = await mongoose.model('NFT').countDocuments({ collection: this._id });
  this.stats = this.stats || {};
  this.stats.totalItems = nftCount;
  
  // You can add more complex stat calculations here
  return this.save();
};

export default mongoose.models.Collection || mongoose.model('Collection', CollectionSchema);