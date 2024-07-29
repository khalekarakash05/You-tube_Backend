import { ApiError } from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import  jwt  from "jsonwebtoken";
import mongoose, { mongo } from "mongoose";


const generateAccessTokenAndRefreshToken=async(userId)=>{
    try {
        const user=await User.findById(userId);
        const accessToken=user.generateAccessToken();
        const refreshToken=user.generateRefreshToken();

        user.refreshToken=refreshToken
        await user.save({ validateBeforeSave :false});

        return {accessToken,refreshToken};
    } catch (error) {
        throw new ApiError(501,"Error occured while generating Tokens");
    }
}


const registerUser=asyncHandler(async (req,res)=>{
    //get user details from fronend
    //validation- not empty
    //check if user already exits :username , email
    //check for images , check for avatar
    //upload them to cloudinary , avatar
    //create user object - create entry in db
    //remove password and refresh token field from response
    //check for user creation 
    //return this response


    //get user details from fronend
    const {fullname,email,password,username}=req.body;
    console.log("fullname ",fullname," email ",email);



    //validation- not empty
    // if(fullname===""){
    //     throw new ApiError(400,"all fields are required");
    // }

    
    if([fullname,email,password,username].some((field)=>
    field?.trim()==="")){
        throw new ApiError(400,"All fields are required");
    }


    //check if user already exits :username , email
    const existingUser= await User.findOne(
        {
            $or: [ {email},{username}]
        }
    )

    if(existingUser){
        throw new ApiError(409,"username or email already exists");
    }


    //check for images , check for avatar
    const avatarLocalPath=req.files?.avatar[0]?.path;
    // const coverImageLocalPath=req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0){
            coverImageLocalPath=req.files.coverImage[0].path
        }


    if(!avatarLocalPath){
        throw new ApiError(409,"Avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath,"YouTube");

    if(!avatar){
        throw new ApiError(409,"Avatar is strictly required");
    }

    //create user object - create entry in db

    const user = await User.create({
        fullname,
        avatar:avatar.secure_url,
        coverImage:coverImage?.secure_url || "",
        email,
        password,
        username:username.toLowerCase(),
    })
    
    //remove password and refresh token field from response
    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )

    
    //check for user creation 
    if(!createdUser){
        throw new ApiError(500,"something went wrong while registering user")
    }

    
    //return this response
    return res.status(201).json(
        new ApiResponse(200, createdUser,"User registered successfully")
    )

})


const loginUser=asyncHandler(async(req,res)=>{
    //req body => data 
    //username or email
    //find that user
    //password check
    //access token and refresh token
    //send these token in cookies


    //req body => data
    const {email,username,password}=req.body;

    //username or email
    if(!(username || email)){
        throw new ApiError(400,"Username or email is required for login");
    }

    //find the user
    const user=await User.findOne({
        $or:[{username},{email}]
    });

    if(!user){
        throw new ApiError(404,"User does not exists");
    }

    //check password
    const isPasswordValid=await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid Credentials");
    }


    //access token and refresh token 
    const {accessToken,refreshToken}=await 
    generateAccessTokenAndRefreshToken(user._id);

    //now send them in cookie
    const loggedInUser=await User.findById(user._id).
    select("-password -refreshToken");

    const options={
        httpOnly:true,
        secure:true,//from these two cookie is not modifiable from frontend 
        //it can only modifiable from backend
    }


    return res.
            status(200).
            cookie("accessToken",accessToken,options).
            cookie("refreshToken",refreshToken,options).
            json(
                new ApiResponse(
                    200,
                    {
                        user:loggedInUser,refreshToken,accessToken,
                    },
                    "User is Logged in Successfully",
                )
            )

})


const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            //updation
            $set:{
                refreshToken : undefined
            }
        },
        {
            new:true
        }
    )

    const options={
        httpOnly:true,
        secure:true
    }


    //remove cookie 
    return res.
    status(200).
    clearCookie("accessToken",options).
    clearCookie("refreshToken",options).
    json(
        new ApiResponse(201,{},"User logged out")
    )
})


const refreshAccessToken = asyncHandler(async(req,res)=>{
    console.log("inside refresh token");
    console.log("lsjfl", req.cookies.refreshToken);
    const incommingRefreshToken= req.cookies.refreshToken;
        console.log("token in cookie", incommingRefreshToken);

    if(!incommingRefreshToken){
        throw new ApiError(404, "Unautherized request")
    }

    try {
        const decodedToken=jwt.verify(
            incommingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        console.log("decoded token", decodedToken._id)
        // console.log("User",)
    
        const user = await User.findById(decodedToken?._id);
    
        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }
        console.log("user",user.username);
    
        if(incommingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is used or Expired")
        }
    
    
        const options={
            httpOnly:true,
            secure:true
        }
    
        const {newRefreshtoken, accessToken}= await generateAccessTokenAndRefreshToken(user._id);
    
        return res.
            status(200).
            cookie("accessToken",accessToken, options).
            cookie("refreshToken", newRefreshtoken, options).
            json(
                new ApiResponse(
                    201,
                    {
                        accessToken,
                        refreshToken:newRefreshtoken
                    },
                    "Access token refreshed"
                )
    
            )
    } catch (error) {
        throw new ApiError(402,error?.message || "Invalid refresh tokens")
    }

}) 


const changeCurrentPassword = asyncHandler(async(req,res)=>{

    const { oldPassword , newPassword } = req.body;

    const user= await User.findById(req.user?._id);

    const isPasswordCorrect= await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid Old Password");
    }

    user.password= newPassword;
    await user.save({validateBeforeSave: false});


    return res.
        status(200).
        json(
            new ApiResponse(201, {}, "Password Updated Successfully")
        )
})


const getCurrUser= asyncHandler(async(req,res)=>{
    console.log("inside getcurruser",req.user)
    return res.
        status(201).
        json(
            new ApiResponse(201, req.user, "Current User Fetched Successfully")
        )
})


const updateAccountDetails= asyncHandler(async(req,res)=>{

    const {fullname, email} = req.body;

    if(!(fullname || email)){
        throw new ApiError(400, "All fields are required")
    }

    const user= await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email: email
            }
        },
        {
            new: true,
        }
    ).select("-password")

    return res.status(200).
        json(
            new ApiResponse(201, user, "User details are updated successfully")
        )
})


const updateUserAvatar= asyncHandler(async(req,res)=>{
    
    const avatarLocalPath= req.file?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }

    const Avatar= await uploadOnCloudinary(avatarLocalPath);

    if(!Avatar.url){
        throw new ApiError(401, "Error while uploading file")
    }

    const user= await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: Avatar.url
            }
        },
        {
            new:true,//it is storing all updated and previous data
        }
    ).select("-password")

    return res.
        status(200).
        json(
            new ApiResponse(201, user, "Avatar is Updated Successfully")
        )
})


const updateUserCoverImage= asyncHandler(async(req,res)=>{

    const coverImageLocalPath= req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400, "CoverImage file is missing")
    }

    const CoverImage = await uploadOnCloudinary(coverImageLocalPath)


    if(!CoverImage.url){
        throw new ApiError(401, "Error occured while uploading coverImage")
    }

    const user= await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: CoverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res.
        status(200).
        json(
            new ApiResponse(201, user, "CoverImage is Updated Successfully")
        )

})


const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {username}= req.params;

    if(!username?.trim()){
        throw new ApiError(400, "Username is missing");
    }

    //aggregation pipelines
    const channel= await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase
            }
        },
        {
            $lookup:{//this is to count subscribers of user who has channel
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                //this is to count channel who has subscribed by user
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribeTo"
            }
        },
        {
            $addFields:{
                //to take count of subscribers and channel which has been subscribed
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelSubscribeToCount:{
                    $size:"$subscribeTo"
                },
                isSubscribed: {
                    $cond:{
                        if:{$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }//to check wheather we have subscribed our channel or not
                }
            }
        },
        {
            $project:{
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                channelSubscribeToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }//project is to show only selected fields
        }
    ])

    if(!channel?.length){
        throw new ApiError(404, "channel does not exits");
    }

    return res.
            status(200).
            json(
                new ApiResponse(200, channel[0],"User channel fetched successfully")
            )
})


const getWatchHistory= asyncHandler(async(req,res)=>{
    const user= await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
                //because in db id is stored in string format to 
                //convert it into number we can convert it through mongoose 
                //while used in aggregation pipeline
            }
        },
        {
            $lookup:{
                from: "videos",//videos collection hai
                localField: "watchHistory",//user collection ke localfield me id watch history nam ke id me hai
                foreignField: "_id",//foreign field me matlab video collection me wo id name se hai
                as:"watchHistory",//aur use ham is name se save karenge
                pipeline:[
                    {
                        $lookup:{
                            from: "users",//this pipeline is for finding owner of watched video
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            //now we have users all data we want specific data only so project it with another pipeline
                            pipeline: [
                                {
                                    $project:{
                                        username:1,
                                        fullname:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner",//to take that first object from above created array
                                //alternative
                                // ($)arrayElemAt: ["$owner", 0]//this is another way to find object from array
                            }
                        }
                    }
                ]
            }
        }
    ])


    


    return res.
            status(200).
            json(
                new ApiResponse(
                    201,
                    user[0].watchHistory,
                    "Watch history fetched successfully"
                )
            )
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
};