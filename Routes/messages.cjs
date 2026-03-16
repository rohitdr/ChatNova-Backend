const express = require('express');
const fetchUser = require('../Middleware/fetchUser.cjs');
const Conversation = require('../Modals/Conversation.cjs');
const Message = require('../Modals/Message.cjs');
const { getReceiverSocketId,io } = require('../Socket/Socket.cjs');
const { default: sendNotification } = require('../Utils/sendNotification.cjs');
const router = express.Router();

// route to send messages login required
router.post('/sendMessage/:id',fetchUser,async(req,res)=>{
 try{    

     const {message} = req.body
          const senderId = req.user.id
          const receiverId=req.params.id
          const receiver = await User.findbyId(receiverId)
          let chat = await Conversation.findOne({
            participents:{$all:[senderId,receiverId]}
          })
          if(!chat){
            chat = await Conversation.create({
                participents:[senderId,receiverId]
            })
          }
          let newMessage = new Message({
            senderId,
            receiverId,
            conversationId:chat._id,
            text:message,
            type:"text"
          })
          if(newMessage){
             chat.messages.push(newMessage._id)
          }
  
       
  
         await Promise.all([chat.save(),newMessage.save()])

          io.to(receiverId).emit("newMessage",newMessage)
         io.to(senderId).emit("newMessage",newMessage)
         if(receiver.deviceTokens?.length){
          await sendNotification(
           message,
            "Rohit Kumar",
            receiver
             
          )
         }
         
       
          return res.status(200).json({status:true,message:newMessage})
 }
  catch(error){
          return res.status(500).json({status:false,message:error.message})
          
     }
})

//route to receive message login required
router.get('/recieveMessage/:id',fetchUser,async(req,res)=>{
  try{
     const senderId = req.params.id
     const receiverId=req.user.id 
     let chat = await Conversation.findOne({
      participents:{$all:[senderId,receiverId]}
     }).populate("messages")
     if(!chat){
      return res.status(200).json({status:true,message:[]})

     }
     return res.status(200).json({status:true,message:chat.messages})

  }
 catch(error){
          return res.status(500).json({status:false,message:error.message})
     }
})


// route for sending uploading images files and videos 
router.post('/sendFile/:id',fetchUser,async(req,res)=>{
 try{    

   const {type,
            url,
        publicId,
        bytes} =req.body
          const senderId = req.user.id
          const receiverId=req.params.id
          let chat = await Conversation.findOne({
            participents:{$all:[senderId,receiverId]}
          })
          if(!chat){
            chat = await Conversation.create({
                participents:[senderId,receiverId]
            })
          }
          let newMessage = new Message({
            senderId,
            receiverId,
            conversationId:chat._id,
            type,
            media:{
            url,
        publicId,
     
        bytes}
          })
          if(newMessage){
             chat.messages.push(newMessage._id)
          }
         //socket 
       
  
         await Promise.all([chat.save(),newMessage.save()])

          io.to(receiverId).emit("newMessage",newMessage)
         io.to(senderId).emit("newMessage",newMessage)
         
       
          return res.status(200).json({status:true,message:newMessage})
 }
  catch(error){
          return res.status(500).json({status:false,message:error.message})
          
     }
})










module.exports=router