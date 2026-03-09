const mongoose= require('mongoose')
const express = require('express');
const fetchUser = require('../Middleware/fetchUser');
const router = express.Router();
const User= require('../Modals/User')
const Conversation = require('../Modals/Conversation');


router.get('/chattedUsers', fetchUser,async(req,res)=>{
    try{
        const currentId=req.user.id;
        let currentchatters = await Conversation.find({
            participents:currentId
        }).populate("participents","-password -email -refress_token").sort({updatedAt:-1})
        if(!currentchatters || currentchatters.length ===0){
            return res.status(200).json({status:true,users:[]})
        }
        const users = currentchatters.map(element=>
                 element.participents.find(
                    user => user._id.toString() !== currentId.toString()
                 )
        )
        res.status(200).json({status:true,users})
    }
     catch(error){
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
        }).select("-password -email -refress_token ")
        if(!users){
            return res.status(404).json({status:false,message:"no user found"})
        }
        return res.status(200).json({status:false,users})
    }
     catch(error){
          return res.status(500).json({status:false,message:error.message})
     }
})










module.exports = router