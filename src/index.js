import dotenv from "dotenv";

import dbConnect from "./db/database.js";
import { app } from "./app.js";

dotenv.config({
    path:"./env"
});

dbConnect().then(()=>{
    app.listen(process.env.PORT || 3000,()=>{
        console.log(`Server is started running on port no: 
        ${process.env.PORT}`)
    })

})
.catch((err)=>{
    console.log(`Mongodb connection error !!! `, err);
});