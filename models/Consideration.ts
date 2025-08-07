import mongoose from 'mongoose';

const considerationSchema = new mongoose.Schema({
    buyer: {
        type: String,
        required: true,
        ref: 'User'
    },
    itemType: { 
        type: Number, 
        required: true,
        enum: [0, 1, 2, 3]
    },
    amount: {
        type: Number,
        required: true
    },
    Id: {
        type: String,
        required: true
    },
    
})

const Consideration = mongoose.models.Consideration || mongoose.model('Consideration', considerationSchema);

export default Consideration;