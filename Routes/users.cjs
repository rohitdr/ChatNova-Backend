const mongoose= require('mongoose')
const express = require('express');
const fetchUser = require('../Middleware/fetchUser.cjs');
const router = express.Router();
const User= require('../Modals/User.cjs')
const Conversation = require('../Modals/Conversation.cjs');
const  asyncHandler  = require('../Utils/asyncHandler.cjs');


router.get('/chattedUsers', fetchUser,asyncHandler( async(req,res)=>{
  
        const currentId=req.user.id;
         const {limit,page}=req.query
        let currentchatters = await Conversation.find({
            type:"private",
            "participents.user":currentId,
            "lastMessage.text":{$exists:true},
      $expr:{$eq:[{$size:"$participents"},2]}
            
        }).populate({path:"participents.user",model:"User",select:"name image username phone_number"}).sort({updatedAt:-1}).skip((page-1)*limit).limit(Number(limit)+1).lean()
    
        if(!currentchatters || currentchatters.length ===0){
            return res.status(200).json({status:true,users:[]})
        }
        
        const users = currentchatters.map(element=>{
                let otheruser =element.participents.find(
                  
                    p => p.user._id.toString() !== currentId.toString()
                  
                 )

            
     
      return {
        ...otheruser,
        ConversationId:element._id,
        lastMessage:element.lastMessage
      };
                }
                 
        )
       
        res.status(200).json({status:true,users:users.slice(0,limit),hasMore : users.length>limit})
    
    
}))


//route to search user with name , username ,phonenumber login required
router.get('/search', fetchUser,asyncHandler(async(req,res)=>{
    
        const currentId=req.user.id;
          const search = req.query.search || " "
          const conversations = await Conversation.find({
            type:"private",
            "participents.user":currentId
          }).select("participents.user").lean()
          const existingUserId = conversations.flatMap((con)=>
            con.participents.map((p)=>p.user.toString())
          .filter((p)=>p !== currentId.toString())
          )
          const objectIds = existingUserId.map(
  (id) => new mongoose.Types.ObjectId(id)
);
        const users = await User.find({
           _id:{$nin:[...objectIds, new mongoose.Types.ObjectId(currentId)]},
            $and:[{
                  $or:[
                    {username:{$regex:search,$options:'i'}},
                    {name:{$regex:search,$options:'i'}}
             
                    
                  ]
            },{
                _id:{$ne:currentId}
            }

            ]
        }).select("-password -email -refress_token -deviceTokens ").limit(15).lean()
       

        if(users.length === 0){
            return res.status(404).json({status:false,message:"No user found"})
        }
        return res.status(200).json({status:true,users})
   
}))

//route to get user by id
// route to get userDetails token required
router.get('/getUser/:id',fetchUser,asyncHandler(async(req,res)=>{
        
            const id = req.params.id
            const user = await User.findById(id).select("-password -refress_token -deviceTokens")
            if(!user){
               return res.status(404).json({status:false,message:"User does not Exist "})
            }
            res.status(200).json({status:true,user})
            

       

}))








module.exports = router