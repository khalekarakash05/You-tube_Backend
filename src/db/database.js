import mongoose from "mongoose";
import { DATABASE_URL } from "../constants.js";

const dbConnect=async()=>{
    try {
        const connectionInstance=await mongoose.connect(`${process.env.DATABASE_URL}/${DATABASE_URL}`)
        console.log(`/n MONGODB is connected successfully DB HOST !! ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("Database connection error ", error);
        process.exit(1);
    }
}

export default dbConnect;