import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['online', 'offline']
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 60 * 24 * 10 // The document will be automatically deleted after 10 days of its creation time
    }
});

export const userModel = mongoose.model('user', userSchema);