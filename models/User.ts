// models/User.ts
import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  walletAddress: { 
    type: String, 
    required: true,
    unique: true,
    lowercase: true
  },
  username: { 
    type: String, 
    required: true,
    trim: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update timestamp on save
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.User || mongoose.model('User', UserSchema);