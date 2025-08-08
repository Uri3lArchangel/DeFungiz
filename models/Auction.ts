import mongoose, { Schema } from 'mongoose';

const AuctionSchema = new Schema({
    collection: {
        type: String,
        required: true,
        ref: 'Collection'
    },
    nftId: {
        type: String,
        required: true,
        ref: 'NFT'
    },
    seller: {
        type: String,
        required: true,
        ref: 'User'
    },
    price: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        required: true,
        default: 'OG'
    },
    status: {
        type: String,
        required: true,
        default: 'active'
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
})