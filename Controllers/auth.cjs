
const bcrypt = require('bcryptjs')
const User= require('../Modals/User.cjs')
const jwt = require('jsonwebtoken')

const asyncHandler = require('../Utils/asyncHandler.cjs');
const cloudinary = require('../Config/Cloudinary.cjs');
const { getIo } = require('../Socket/socketInstance.cjs');




// -------------CREATE USER-------------------
const createUser =asyncHandler( async(req,res)=>{

      const {email,password,username}=req.body
      let existingUser = await User.findOne({
          $or:[{email},{username}]
      }).select("email username")
    
     if(existingUser){
         const message= existingUser.email === email ?"This email already exits Use new one":"This username already exists "
          return res.status(409).json({status:false,message})
     }
    

      const salt = await bcrypt.genSalt(10);
      const hashedPassowrd = await bcrypt.hash(password,salt) 
         
     let  user = await User.create({
          email,
          password:hashedPassowrd,
          username
       })
     const payload={
          id:user.id
      }

      const refreshToken =jwt.sign(payload,process.env.REFRESS_SECRET,{expiresIn:"7d"})
   
      const accessToken =jwt.sign(payload,process.env.ACCESS_SECRET,{expiresIn:"7m"})
         await User.updateOne({_id:user.id},{$set:{refreshToken,onlineStatus:true}});
       return res.status(200).json({status:true,accessToken,refreshToken})
    
})
// -------------------LOGIN ----------------------------
const login=asyncHandler(async(req,res)=>{
         
     const {email,password}=req.body
      let user= await User.findOne({email:email}).select("-deviceTokens")
      if(!user || !(await bcrypt.compare(password,user.password))){
           return res.status(400).json({status:false,message:"Please use Correct correndentials"})
      }
      const payload={
          id:user.id
      }
 
      const refreshToken=jwt.sign(payload,process.env.REFRESS_SECRET,{expiresIn:"7d"})
   
      const accessToken=jwt.sign(payload,process.env.ACCESS_SECRET,{expiresIn:"7m"})
      if(user.refreshToken !== refreshToken){
      await User.updateOne({_id:user.id},{$set:{refreshToken,onlineStatus:true}});
       }
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
       
     return res.status(200).json({status:true,userToSend,accessToken,refreshToken})
    
         
})
// -----------------------REFRESH ACCESS TOKEN ------------------------------------
const refresh=asyncHandler (async(req,res)=>{

      const authHeader = req.headers.authorization
    
      if(!authHeader || !authHeader.startsWith("Bearer ")){
           return res.status(401).json({status:false,message:"Please login again "})
      }
      const refreshToken=authHeader.split(" ")[1].trim()
      const decoded = jwt.verify(refreshToken,process.env.REFRESS_SECRET)
      let user = await User.findById(decoded.id).select("refreshToken")

      if(!user || user.refreshToken !== refreshToken){
             return res.status(401).json({status:false,message:"Invalid refresh token"})
      }
      
      const accessToken = jwt.sign({id:decoded.id},process.env.ACCESS_SECRET,{expiresIn:"7m"})
       return res.status(200).json({status:true,accessToken})
      

})



//-------------LOGOUT ------------------

const logout = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(200).json({ status: true, message: "Already logged out" });

    await User.findByIdAndUpdate(userId, { $set: { refreshToken: null, onlineStatus: false } });
    return res.status(200).json({ status: true, message: "User logged out successfully" });
});

// ------------------FORGET PASSWORD -------------------
const forgetPassowrd=asyncHandler(async(req,res)=>{
        
            
          const {email,password,username}=req.body
          let user = await User.findOne({email:email}).select("username")
          if(!user || username!==user.username){
              return res.status(404).json({status:false,message:"Use Correct Corredentials "})
          }
          
          const salt = await bcrypt.genSalt(10)
          const hashedPassowrd = await bcrypt.hash(password,salt)
           user = await User.updateOne(
               {_id:user.id},
               {$set:{password:hashedPassowrd}}
           )
          
          return res.status(200).json({status:true,message:"password changed successfully"})




         
})
// -----------------------UPDATE PASSWORD ----------------------------
const updatePassword=asyncHandler(async(req,res)=>{
      
          const {oldPassword,newPassword}=req.body
         
          let user = await User.findById(req.user.id).select("password")
          if(!user){
              return res.status(401).json({status:false,message:"Please login again "})
          }
          let isMatch = await bcrypt.compare(oldPassword,user.password)
          if(!isMatch){
               return res.status(400).json({status:false,message:"Please use the correct old password "})
          }
          const salt = await bcrypt.genSalt(10)
          const changedPassword = await bcrypt.hash(newPassword,salt)
           await User.updateOne(
               {_id:user.id},
               {$set:{password:changedPassword}}
           )
          
          return res.status(200).json({status:true,message:"password changed successfully"})




})
          
// --------------------GET USER-------------------
const getUser=asyncHandler(async(req,res)=>{
    
            const user = await User.findById(req.user.id).select("-password -refreshToken -deviceTokens").lean()
            if(!user){
               return res.status(404).json({status:false,message:"User does not Exist "})
            }
            res.status(200).json({status:true,user})
            

       

})
//-----------------UPDATE USER ---------------------
const update=asyncHandler(async(req,res)=>{
      const io=getIo()

         const {name,email,username,image,phone_number}=req.body
            const id = req.user.id 
            const user = await User.findById(id)
              if(!user){
               return res.status(404).json({status:false,message:"User does not Exist "})
            }
             let updatedData ={}
             if(name){
               updatedData.name = name
             }
             if(email){
               updatedData.email = email
               let userbyemail = await User.findOne({email:email})
               if(userbyemail && userbyemail._id.toString() !== id){
                      return res.status(409).json({status:false,message:"Email already exist "})
               }
             }
             if(username){
               updatedData.username = username
               let userbyusername = await User.findOne({username:username})
               if(userbyusername && userbyusername._id.toString() !== id){
                    return res.status(409).json({status:false,message:"username already taken"})
               }
             }
             if(phone_number){
               updatedData.phone_number = phone_number
               let userbynumber = await User.findOne({phone_number:phone_number})
               if(userbynumber && userbynumber._id.toString() !== id){
                   return res.status(409).json({status:false,message:"Phone number is already taken"})
               }
             }
             if(image){
               if(user.image?.publicId){
              await cloudinary.uploader.destroy(user.image.publicId)
               }
               updatedData.image=image
             }
            const updateUser = await User.findByIdAndUpdate(
               id,{$set:updatedData},{$new:true}

            )
           
    const userToSend={
  _id:updateUser._id.toString(),
  username:updateUser.username,
  name:updateUser.name,
  email:updateUser.email,
  phone_number:updateUser.phone_number,
  image:updateUser.image,
  onlineStatus:updateUser.onlineStatus,
  ...updatedData
  
    }
          io.to(id).emit("updateUser",userToSend)
            res.status(200).json({status:true,message:"User has been updated"})
            

})


// ---------------------DEVICE TOKEN --------------------------
const deviceToken=asyncHandler(async(req,res)=>{
     
   
     const {deviceToken}=req.body
     const user = await User.findById(req.user.id).select("deviceTokens")
     if(!user){
          return res.status(404).json({status:false,message:"Please Login again"})
     }
    if(!user.deviceTokens) user.deviceTokens =[]
    if(!user.deviceTokens.includes(deviceToken)){
     user.deviceTokens.push(deviceToken)
    }
     res.status(200).json({status:false,message:"Device token saved successfully"})
    
 
})



module.exports= {createUser,login,refresh,logout,deviceToken,updatePassword,forgetPassowrd,updatePassword,update,getUser}