import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now, // Passes the Date.now function as a reference, so Mongoose will call this function each time a new document is created, ensuring the createdAt field is set to the correct time
        expires: 60 * 60 * 24 * 10 // The document will be automatically deleted after 10 days of its creation time
    }
});

export const messageModel = mongoose.model('message', messageSchema);