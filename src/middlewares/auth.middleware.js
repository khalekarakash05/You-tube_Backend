import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import jwt from 'jsonwebtoken';

export const verifyJWT = asyncHandler(async (req,_,next)=>{
    try {
        const token = req.cookies?.accessToken || 
        req.header("Authorization")?.replace("Bearer ","")//to access token from header body or from cookies
    
        if(!token){
            throw new ApiError(401,"Unauthorized request");
        }
    
        //now check token correct or not 
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
    
        const user=await User.findById(decodedToken._id).select(
            "-password -refreshToken"
        )
    
        if(!user){
            throw new ApiError(401,"Invalid Access Token");
        }
    
        req.user=user;//req ke andar user bhej diya 
        next();
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid Access Token")
        
    } 
})