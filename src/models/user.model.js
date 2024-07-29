import mongoose from "mongoose";
import jwt from 'jsonwebtoken';
import bcrypt from "bcrypt";

const userSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:[true, "Unique username is required"],
        lowercase:true,
        trim:true,
        index:true,//index used for searching
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullname:{
        type:String,
        required:true,
        trim:true,
        index:true,
    },
    avatar:{
        type:String,//avtar cloudinary pe upload karke uska url yaha pe store karenge
        required:true,
    },
    coverImage: {
        type:String,// yaha pe cloudinary ka url store karenge
    },
    watchHistory: [{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video",
    }],//yaha pe video watch history ka track rakhenge
    password:{
        type:String,
        required:[true, "Password is required"],
    },
    refreshToken:{
        type:String,
    }

},
{
    timestamps:true,//it will store created at and updated at in database
});

//pre middleware
userSchema.pre("save", async function(next){
    //password jab modify hua hai tab hi use hash karna hai nahi to retur
    //karna hai 
    if(! this.isModified("password")){
        return next();
    }

    //agar modify hau to hash kardo use
    this.password= await bcrypt.hash(this.password, 10); //it is hashed password 
    next();
})



//custom method 
userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password, this.password);
    //it is comparing password with hashed password using compare from bcrypt

}

//custom methods
userSchema.methods.generateAccessToken=function (){
    return  jwt.sign({
        //payload pass kardo
        _id:this._id,
        email:this.email,
        username:this.username,
        fullname:this.fullname,
    },
    //now pass jwt access secret which stored in .env file
    process.env.ACCESS_TOKEN_SECRET,
    {
        //now pass expiry of that access token
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
    )
}

userSchema.methods.generateRefreshToken=function(){
    // console.log("generating refersh token");
    return  jwt.sign({
        //payload pass kardo
        _id:this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        //now pass expiry of that access token
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY,
    }
    )
}


export const User=mongoose.model("User",userSchema);