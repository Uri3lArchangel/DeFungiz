// models/Listing.ts
import mongoose, { Schema } from 'mongoose';


const ListingSchema = new Schema({
    nftId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'NFT'
    },
    seller: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    price: { 
        type: Number, 
        required: true 
    },
    deadline: {
        type: Number,
        required: true
    },
    status: { 
        type: String, 
        enum: ['active', 'sold', 'cancelled'], 
        default: 'active' 
    },
    signature: {
        type: String,
        required: true
    },
    nonce: {
        type: Number,
        required: true
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    },
    offer: {
        type: Schema.Types.ObjectId,
        ref: 'Offer'
    },
    consideration: {
        type: Schema.Types.ObjectId,
        ref: 'Consideration'
    }
}, { timestamps: true });

export default mongoose.models.Listing || mongoose.model('Listing', ListingSchema);