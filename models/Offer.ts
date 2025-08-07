// models/Offer.ts
import mongoose, { Schema } from 'mongoose';


const OfferSchema = new Schema({
    Id: {
        type: String,
        required: true,
        ref: 'NFT'
    },
    buyer: {
        type: String,
        required: true,
        ref: 'User'
    },
    amount: { 
        type: Number, 
        required: true 
    },
    itemType: { 
        type: Number, 
        required: true ,
        enum: [0, 1, 2, 3]
    },
    status: { 
        type: String, 
        enum: ['pending', 'accepted', 'rejected'], 
        default: 'pending' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
}, { timestamps: true });

export default mongoose.models.Offer || mongoose.model('Offer', OfferSchema);