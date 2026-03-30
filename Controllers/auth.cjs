
const bcrypt = require('bcryptjs')
const User= require('../Modals/User.cjs')
const jwt = require('jsonwebtoken')
const {validationResult}=require('express-validator');
const fetchUser = require('../Middleware/fetchUser.cjs');
const asyncHandler = require('../Utils/asyncHandler.cjs');
const { io } = require('../Socket/Socket.cjs');
const cloudinary = require('../Config/Cloudinary.cjs');




//path to create a user, not required access token
const createUser =asyncHandler( async(req,res)=>{
  
     let validationresult = validationResult(req)
          if(!validationresult.isEmpty()){
                 return res.status(400).json({ status:false,message:validationresult.array()[0].msg})
          }
     
      const {email,password,username}=req.body
      let existingUser = await User.findOne({
          $or:[{email},{username}]
      }).select("email")
    
     if(existingUser){
          return res.status(409).json({status:false,message:existingUser.email === email ?"This email already exits Use new one":"This username already exists "})
     }
    

      const salt = await bcrypt.genSalt(10);
      const securePassword = await bcrypt.hash(password,salt) 
         
     let  user = await User.create({
          email,
          password:securePassword,
          username
       })
     const data={
          id:user.id
      }
 
      const refress_token=jwt.sign(data,process.env.REFRESS_SECRET,{expiresIn:"7d"})
   
      const access_token=jwt.sign(data,process.env.ACCESS_SECRET,{expiresIn:"7m"})
         await User.updateOne({_id:user.id},{$set:{refress_token,onlineStatus:true}});
       return res.status(200).json({status:true,access_token,refress_token})
    
})
//path to login for the user
const login=asyncHandler(async(req,res)=>{
      
       
               let validationresult = validationResult(req)
          if(!validationresult.isEmpty()){
                 return res.status(400).json({ status:false,message:validationresult.array()[0].msg})
          }
     const {email,password}=req.body
      let user= await User.findOne({email:email}).select("-deviceTokens")
      if(!user){
           return res.status(400).json({status:false,message:"Please use Correct correndentials"})
      }
      let passCompare= await bcrypt.compare(password,user.password)
      if(!passCompare){
             return res.status(400).json({status:false,message:"Please use Correct correndentials"})
      }
      const data={
          id:user.id
      }
 
      const refress_token=jwt.sign(data,process.env.REFRESS_SECRET,{expiresIn:"7d"})
   
      const access_token=jwt.sign(data,process.env.ACCESS_SECRET,{expiresIn:"7m"})
      const userToSend = {
         
    _id: user._id.toString(),
    username: user.username,
    email: user.email,
    name: user.name,
    phone_number:user.phone_number,
    image: user.image,
    onlineStatus: true,
  

      }
      //for production
     //  res.cookie("refress_token",refress_token,{httpOnly:false,sameSite:"lax",secure:false,path:'/'})
       if(user.refress_token !== refress_token){
      await User.updateOne({_id:user.id},{$set:{refress_token,onlineStatus:true}});
       }
     return res.status(200).json({status:true,userToSend,access_token,refress_token})
    
         
})
// // route to get new access token from refress token when it expires
const refress=asyncHandler (async(req,res)=>{

      const authHeader = req.headers.authorization
    
      if(!authHeader){
           return res.status(401).json({status:false,message:"Please login again to continue"})
      }
      const refress_token=authHeader.split(" ")[1]
      const data = jwt.verify(refress_token,process.env.REFRESS_SECRET)
      let user = await User.findById(data.id).select("refress_token")

      if(!user){
             return res.status(401).json({status:false,message:"User Not Found"})
      }
      if(user.refress_token !== refress_token){
             return res.status(401).json({status:false,message:"Please use a valid refress token"})
      }
      const userId = {
          id:data.id
      }
      const access_token = jwt.sign(userId,process.env.ACCESS_SECRET,{expiresIn:"7m"})
       return res.status(200).json({status:true,access_token})
      

})



// // route to login access token required

const logout=asyncHandler(async(req,res)=>{
   
         
     const id = req.user.id 
     let user = await User.findById(id)
      if(user){
           user = await User.findByIdAndUpdate({_id:id},{$set:{refress_token:null}})
      }
     if(!user){
        return res.status(404).json({status:false,message:"Something went wrong"})
     }
     user = await User.findByIdAndUpdate({_id:id},{$set:{onlineStatus:false}})
     //for production
     // res.clearCookie('refress_token')
     return res.status(200).json({status:true,message:"User logout Successfully"})
    
})
const forgetPassowrd=asyncHandler(async(req,res)=>{
        
               let validationresult = validationResult(req)
          if(!validationresult.isEmpty()){
                return res.status(400).json({ status:false,message:validationresult.array()[0].msg})
          }
          const {email,password,username}=req.body
          let user = await User.findOne({email:email}).select("username")
          if(!user){
              return res.status(404).json({status:false,message:"Use Correct Corredentials "})
          }
          if (username!==user.username){
                 return res.status(404).json({status:false,message:"Use Correct Corredentials "})
          }
          const salt = await bcrypt.genSalt(10)
          const updatePassword = await bcrypt.hash(password,salt)
           user = await User.updateOne(
               {_id:user.id},
               {$set:{password:updatePassword}}
           )
          
          return res.status(200).json({status:true,message:"password changed successfully"})




         
})
//route to update password of login user no authentication required
const updatePassword=asyncHandler(async(req,res)=>{
      
               let validationresult = validationResult(req)
          if(!validationresult.isEmpty()){
                return res.status(400).json({ status:false,message:validationresult.array()[0].msg})
          }
          const {oldPassword,newPassword}=req.body
          const userId=req.user.id
          let user = await User.findById(userId).select("password")
          if(!user){
              return res.status(401).json({status:false,message:"Please login again "})
          }
          let comparpass = await bcrypt.compare(oldPassword,user.password)
          if(!comparpass){
               return res.status(400).json({status:false,message:"Please use the correct old password "})
          }
          const salt = await bcrypt.genSalt(10)
          const changedPassowrd = await bcrypt.hash(newPassword,salt)
           user = await User.updateOne(
               {_id:user.id},
               {$set:{password:changedPassowrd}}
           )
          
          return res.status(200).json({status:true,message:"password changed successfully"})




})
          
// route to get userDetails token required
const getUser=asyncHandler(async(req,res)=>{
    
            const id = req.user.id 
            const user = await User.findById(id).select("-password -refress_token -deviceTokens").lean()
            if(!user){
               return res.status(404).json({status:false,message:"User does not Exist "})
            }
            res.status(200).json({status:true,user})
            

       

})

const update=asyncHandler(async(req,res)=>{
      

         const {name,email,username,image,phone_number}=req.body
            const id = req.user.id 
            const user = await User.findById(id)
              if(!user){
               return res.status(404).json({status:false,message:"User does not Exist "})
            }
             let newUser ={}
             if(name){
               newUser.name = name
             }
             if(email){
               newUser.email = email
               let userbyemail = await User.findOne({email:email})
               if(userbyemail && userbyemail._id.toString() !== id){
                      return res.status(409).json({status:false,message:"Email already exist "})
               }
             }
             if(username){
               newUser.username = username
               let userbyusername = await User.findOne({username:username})
               if(userbyusername && userbyusername._id.toString() !== id){
                    return res.status(409).json({status:false,message:"username already taken"})
               }
             }
             if(phone_number){
               newUser.phone_number = phone_number
               let userbynumber = await User.findOne({phone_number:phone_number})
               if(userbynumber && userbynumber._id.toString() !== id){
                   return res.status(409).json({status:false,message:"Phone number is already taken"})
               }
             }
             if(image){
               if(user.image?.publicId){
              await cloudinary.uploader.destroy(user.image.publicId)
               }
               newUser.image=image
             }
            const updateUser = await User.findByIdAndUpdate(
               id,{$set:newUser},{$new:true}

            )
           
    const userToSend={
  _id:updateUser._id.toString(),
  username:updateUser.username,
  name:updateUser.name,
  email:updateUser.email,
  phone_number:updateUser.phone_number,
  image:updateUser.image,
  onlineStatus:updateUser.onlineStatus,
  ...newUser
  
    }
          io.to(id).emit("updateUser",userToSend)
            res.status(200).json({status:true,message:"User has been updated"})
            

})



const deviceToken=asyncHandler(async(req,res)=>{
     
    const userId = req.user.id
     const {deviceToken}=req.body
     const user = await User.findById(userId).select("deviceTokens")
     if(!user){
          return res.status(404).json({status:false,message:"Please Login again"})
     }
    if(!user.deviceTokens) user.deviceTokens =[]
    if(!user.deviceTokens.includes(deviceToken)){
     user.deviceTokens.push(deviceToken)
    }
     res.status(200).json({status:false,message:"Device token saved successfully"})
    
 
})



module.exports= {createUser,login,refress,logout,deviceToken,updatePassword,forgetPassowrd,updatePassword,update,getUser}