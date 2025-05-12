import User from "../models/users.js";
import bcrypt from "bcrypt";
import { generateToken } from "../lib/utils.js";
import {cloudinary} from "../lib/claudinary.js";
export const signup = async (req,res)=>{
   const {email,fullName,password,profilePicture} = req.body;
   try{
    if(!email || !fullName || !password){
        return res.status(400).json({message:"All fields are required"});
    }
    if(password.length < 8){
        return res.status(400).json({message:"Password must be at least 8 characters long"});
   }
   const user = await User.findOne({email});
   if(user){
    return res.status(400).json({message:"User already exists"});
   }
   const salt = await bcrypt.genSalt(10);
   const hashedPassword = await bcrypt.hash(password,salt);
   const newUser = new User({email,fullName,password:hashedPassword});
   if(newUser){
    generateToken(res,newUser._id);
    await newUser.save();
    res.status(201).json({
        _id:newUser._id,
        email:newUser.email,
        fullName:newUser.fullName,
        profilePicture:newUser.profilePicture,
    });
   }
   else{
    return res.status(400).json({message:"Invalid user data"});
   }
  
}
catch(error){
    console.log("Error in signup controller",error.message);
    res.status(500).json({message:"Internal server error"});

}}





export const login = async (req,res)=>{
    const {email,password} = req.body;
    const user = await User.findOne({email});
    if(!user){
        return res.status(400).json({message:"User not found"});
    }
    const isPasswordValid = await bcrypt.compare(password,user.password);
    if(!isPasswordValid){
        return res.status(400).json({message:"Invalid email or password"});
    }
    generateToken(res,user._id);
    res.status(200).json({
        _id:user._id,
        email:user.email,
        fullName:user.fullName,
        profilePicture:user.profilePicture,
    });
}
export const logout = (req,res)=>{
    
    try{
        res.cookie("jwt","",{
            httpOnly:true,
            expires:new Date(0),
        });
        res.status(200).json({message:"Logged out successfully"});
    }
    catch(error){
        console.log("Error in logout controller",error.message);
        res.status(500).json({message:"Internal server error"});
    }
}

export const updateProfile = async (req,res)=>{
    try{
        const {profilePicture} = req.body;
        const userId = req.user._id;

        if(!profilePicture){
            return res.status(400).json({message:"Profile picture is required"});
           

        }
        const uploadResponse = await cloudinary.uploader.upload(profilePicture)
        const updatedUser = await User.findByIdAndUpdate(userId,{
            profilePicture:uploadResponse.secure_url,
        },{new:true});
       res.status(200).json(updatedUser);
    }
    catch(error){
        console.log("Error in updateProfile controller",error.message);
        res.status(500).json({message:"Internal server error"});
    }
}

export const checkAuth = (req,res)=>{
    try{
        res.status(200).json(req.user);

    }
    catch(error){
        console.log("Error in checkAuth controller",error.message);
        res.status(500).json({message:"Internal server error"});
    }
}
