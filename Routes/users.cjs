const mongoose= require('mongoose')
const express = require('express');
const fetchUser = require('../Middleware/fetchUser.cjs');
const router = express.Router();
const User= require('../Modals/User.cjs')
const Conversation = require('../Modals/Conversation.cjs');


router.get('/chattedUsers', fetchUser,async(req,res)=>{
    try{
        const currentId=req.user.id;
        let currentchatters = await Conversation.find({
            participents:currentId
        }).populate({
      path: "messages",
      options: { sort: { createdAt: -1 }, limit: 1 } // only last message
    }).populate("participents","-password -email -refress_token -deviceTokens").sort({updatedAt:-1})
     
        if(!currentchatters || currentchatters.length ===0){
            return res.status(200).json({status:true,users:[]})
        }
        const users = currentchatters.map(element=>{
                const user =element.participents.find(
                    user => user._id.toString() !== currentId.toString()
                 )
                 const lastMessage = element.messages[0] || null;

      return {
        ...user.toObject(),
        conversationId: element._id,
        lastMessage: lastMessage ? lastMessage.text : null,
        lastMessageId: lastMessage ? lastMessage._id : null,
        lastMessageTime: lastMessage ? lastMessage.createdAt : null
      };
                }
                 
        )
         const onlineUsers =users.filter(user=>user && user.onlineStatus===true)
        res.status(200).json({status:true,users,onlineUsers})
    }
     catch(error){
          console.log(error.message)
          return res.status(500).json({status:false,message:error.message})
     }
})


//route to search user with name , username ,phonenumber login required
router.get('/search', fetchUser,async(req,res)=>{
    try{
        const currentId=req.user.id;
          const search = req.query.search || " "
        const users = await User.find({
            $and:[{
                  $or:[
                    {username:{$regex:'.*'+search+'.*',$options:'i'}},
                    {name:{$regex:'.*'+search+'.*',$options:'i'}}
                    
                  ]
            },{
                _id:{$ne:currentId}
            }

            ]
        }).select("-password -email -refress_token -deviceTokens ")
        if(!users){
            return res.status(404).json({status:false,message:"no user found"})
        }
        return res.status(200).json({status:true,users})
    }
     catch(error){
          console.log(error.message)
          return res.status(500).json({status:false,message:error.message})
     }
})

//route to get user by id
// route to get userDetails token required
router.get('/getUser/:id',fetchUser,async(req,res)=>{
        try{
            const id = req.params.id
            const user = await User.findById(id).select("-password -refress_token -deviceTokens")
            if(!user){
               return res.status(404).json({status:false,message:"User does not Exist "})
            }
            res.status(200).json({status:true,user})
            

        }
           catch(error){
              console.log(error.message)
               return res.status(500).json({status:false,message:error.message})  
          }

})









module.exports = router