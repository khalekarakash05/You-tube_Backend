const express=require("express");
const app=express();
// const port=3000;
require("dotenv").config();

app.get("/",(req,res)=>{
    res.send("Hellow world");
})

app.get("/twitter",(req,res)=>{
    res.send("Welcome to Twitter Page")
})

app.listen(process.env.PORT,()=>{
    console.log(`App is running succufully on Port no ${process.env.PORT}`)
})