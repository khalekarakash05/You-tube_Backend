import {v2 as cloudinary} from "cloudinary";
import fs from "fs";


cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET,
})


const uploadOnCloudinary=async(localFilePath)=>{
    try {
        if(!localFilePath){
            //localfilepath nahi hai to return kar lo
            return null;
        }
        console.log("checking localfilepath",localFilePath);
    
        //now upload file on cloudinary
        
        const response= await cloudinary.uploader.upload(localFilePath,{
            //pass  options
            resource_type:"auto",
        })
        
        fs.unlinkSync(localFilePath);//unlink or delete this file from server

        // console.log("file is uploaded successfully on cloudinary",response);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);//removed locally saved temporary file
        return null;
        
    }
}

export {
    uploadOnCloudinary
}