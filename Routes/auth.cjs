const express= require('express')
const bcrypt = require('bcryptjs')
const router = express.Router();
const User= require('../Modals/User.cjs')
const jwt = require('jsonwebtoken')
const {body,validationResult}=require('express-validator');
const fetchUser = require('../Middleware/fetchUser.cjs');





//path to create a user, not required access token
router.post('/createUser',[
     body('name').isLength({min:3}),
     body('email').isEmail(),
     body('username').isLength({min:8}),
     body('phone_number').isLength({min:10,max:10}).isNumeric(),
     body('password').isLength({min:8})

],async(req,res)=>{
    try{
     let validationresult = validationResult(req)
          if(!validationresult.isEmpty()){
                 return res.status(404).json({error:validationresult.array()})
          }
     
      const {email,password,name,username,phone_number}=req.body
      let user = await User.findOne({email:email})
     if(user){
          return res.status(404).json({status:false,message:"This email already exits Use new one"})
     }
     user = await User.findOne({username:username})
     if(user){
          return res.status(404).json({status:false,message:"This Username already exits Use new one"})
     }

      const salt = await bcrypt.genSalt(10);
      const securePassword = await bcrypt.hash(password,salt) 
      user = await User.create({
          email,
          password:securePassword,
          name,
          phone_number,
          username
       })
     
       return res.status(200).json({status:true,message:"Account Created successfully"})
     }
     catch(error){
          return res.status(500).json({status:false,message:error.message})
     }
})
//path to login for the user
router.post('/login',[ 
     body('email').isEmail(),
     body('password').isLength({min:8})],async(req,res)=>{
          try{
           console.log(req.body)
               let validationresult = validationResult(req)
          if(!validationresult.isEmpty()){
                 return res.status(404).json({error:validationresult.array()})
          }
     const {email,password}=req.body
      let user= await User.findOne({email:email})
      if(!user){
           return res.status(401).json({status:false,message:"Please use Correct correndentials"})
      }
      let passCompare= await bcrypt.compare(password,user.password)
      if(!passCompare){
             return res.status(401).json({status:false,message:"Please use Correct correndentials"})
      }
      const data={
          id:user.id
      }
 
      const refress_token=jwt.sign(data,process.env.REFRESS_SECRET,{expiresIn:"7d"})
   
      const access_token=jwt.sign(data,process.env.ACCESS_SECRET,{expiresIn:"7m"})

      //for production
     //  res.cookie("refress_token",refress_token,{httpOnly:false,sameSite:"lax",secure:false,path:'/'})

      await User.updateOne({_id:user.id},{$set:{refress_token,onlineStatus:true}});
   
     return res.status(200).json({status:true,access_token,refress_token})
    
          }
          catch(error){
               return res.status(500).json({status:false,message:error.message})  
          }
})
// route to get new access token from refress token when it expires
router.post('/refresh',async(req,res)=>{
try{
      const authHeader = req.headers.authorization
    
      if(!authHeader){
           return res.status(494).json({status:false,message:"Please login again to continue"})
      }
      const refress_token=authHeader.split(" ")[1]
      const data = jwt.verify(refress_token,process.env.REFRESS_SECRET)
      let user = await User.findById(data.id)
      if(user.refress_token !== refress_token){
             return res.status(474).json({status:false,message:"Please use a valid refress token"})
      }
      const userId = {
          id:data.id
      }
      const access_token = jwt.sign(userId,process.env.ACCESS_SECRET,{expiresIn:"7m"})
       return res.status(200).json({status:true,access_token})
      
}
catch(error){
         return res.status(500).json({status:false,message:error.message}) 
}
})



// route to login access token required

router.post('/logout',fetchUser,async(req,res)=>{
     try{
         
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
     }catch(error){
           return res.status(500).json({status:false,message:error.message})   
     }
})
router.put('/forgetPassword',[
      body('email').isEmail(),
      body('username').isLength({min:8}),
      body('password').isLength({min:8})
     ],async(req,res)=>{
          try{
               let validationresult = validationResult(req)
          if(!validationresult.isEmpty()){
                 return res.status(404).json({error:validationresult.array()})
          }
          const {email,password,username}=req.body
          let user = await User.findOne({email:email})
          if(!user){
              return res.status(404).json({status:false,message:"Use Correct Corredentials "})
          }
          if (username!==user.username){
                 return res.status(404).json({status:false,message:"Use Correct Corredentials "})
          }
          const salt = await bcrypt.genSalt(10)
          const newpassword = await bcrypt.hash(password,salt)
           user = await User.updateOne(
               {_id:user.id},
               {$set:{password:newpassword}}
           )
           if(!user){
                    return res.status(404).json({status:false,message:"Password not changed"})
           }
          return res.status(200).json({status:true,message:"password changed successfully"})




          }
           catch(error){
               return res.status(500).json({status:false,message:error.message})  
          }
})
          
// route to get userDetails token required
router.get('/getUser',fetchUser,async(req,res)=>{
        try{
            const id = req.user.id 
            const user = await User.findById(id).select("-password -refress_token")
            if(!user){
               return res.status(404).json({status:false,message:"User does not Exist "})
            }
            res.status(200).json({status:true,user})
            

        }
           catch(error){
               return res.status(500).json({status:false,message:error.message})  
          }

})

router.post('/update',fetchUser,async(req,res)=>{
      try{


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
               if(userbyemail){
                      return res.status(404).json({status:false,message:"Email already exist "})
               }
             }
             if(username){
               newUser.username = username
               let userbyusername = await User.findOne({username:username})
               if(userbyusername){
                    return res.status(404).json({status:false,message:"username already taken"})
               }
             }
             if(phone_number){
               newUser.phone_number = phone_number
               let userbynumber = await User.findOne({phone_number:phone_number})
               if(userbynumber){
                   return res.status(404).json({status:false,message:"Phone number is already taken"})
               }
             }
             if(image){
               newUser.image=image
             }
            const updateUser = await User.findByIdAndUpdate(
               id,{$set:newUser},{$new:true}

            )

            res.status(200).json({status:true,message:"User has been updated"})
            

        }
           catch(error){
               return res.status(500).json({status:false,message:error.message})  
          }
})




router.post('/deviceToken', fetchUser,async(req,res)=>{
     try{
    const userId = req.user.id
     const {deviceToken}=req.body
     const user = await User.findById(userId)
     if(!user){
          return res.status(404).json({status:false,message:"Please Login again"})
     }
     if(!user.deviceTokens || user.deviceTokens?.length===0 || !user.deviceTokens?.includes(deviceToken)){
      user.deviceTokens.push(deviceToken)
      await user.save()
     }
     res.status(200).json({status:false,message:"Device token saved successfully"})
     }
           catch(error){
               return res.status(500).json({status:false,message:error.message})  
          }
 
})
module.exports= router