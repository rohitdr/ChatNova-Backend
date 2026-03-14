const express = require('express');
const fetchUser = require('../Middleware/fetchUser.cjs');
const Conversation = require('../Modals/Conversation.cjs');
const Message = require('../Modals/Message.cjs');
const { getReceiverSocketId,io } = require('../Socket/Socket.cjs');
const router = express.Router();

// route to send messages login required
router.post('/sendMessage/:id',fetchUser,async(req,res)=>{
 try{    

     const {message} = req.body
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
            message
          })
          if(newMessage){
             chat.messages.push(newMessage._id)
          }
         //socket 
         const receiverSocketId = getReceiverSocketId(receiverId)
         console.log(receiverSocketId)
         const msgToSend = {
  _id: newMessage._id,
  senderId: newMessage.senderId,
  receiverId: newMessage.receiverId,
  conversationId: newMessage.conversationId,
  message: newMessage.message,
  createdAt: newMessage.createdAt,
  updatedAt: newMessage.updatedAt
};
         if(receiverSocketId){
          io.to(receiverSocketId).emit("newMessage",msgToSend)
        
         }

          await Promise.all([chat.save(),newMessage.save()])
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











module.exports=router