// models/Transaction.ts
import mongoose, { Schema } from 'mongoose';

const TransactionSchema = new Schema({
  type: {
    type: String,
    enum: ['mint', 'transfer', 'sale', 'bid', 'cancel', 'auction', 'offer', 'listing', 'purchase', 'lazy_mint', 'lazy_mint_collection'],
    required: true
  },
  nft: {
    type: Schema.Types.ObjectId,
    ref: 'NFT'
  },
  collection: {
    type: Schema.Types.ObjectId,
    ref: 'Collection'
  },

  user: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'OG'
  },
  gasFee: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  txHash: {
    type: String,
    required: true
  },
  from: {
    type: String
  },
  to: {
    type: String
  },
  metadata: {
    type: Object
  }
}, { timestamps: true });

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);