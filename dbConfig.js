import mongoose from "mongoose";

export const connectToDatabase = async()=>{
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to MongoDB');        
    } catch (error) {
        console.log(error);
    }
}