const {Server} =require("socket.io")
const express = require('express')
const http = require('http')
const  cors = require("cors");
const app =express();
const server = http.createServer(app)
const User = require('../Modals/User.cjs');
const {updateReaction,markSeen}  = require("../Controllers/socket.cjs");
const Conversation = require('../Modals/Conversation.cjs')
const Message = require('../Modals/Message.cjs')
app.use(cors({
  origin: process.env.FRONTEND_URL, // your frontend
  credentials: true,
}))
const io = new Server(server,{
       cors:{
        origin:[process.env.FRONTEND_URL],
        methods:["GET","POST"],
        credentials: true
    }
})

 const getReceiverSocketId=(receiverId)=>{
        return userSocketmap[receiverId]
}
const userSocketmap={}


io.on("connection",async(socket)=>{
    const userId = socket.handshake.query.userId 
    await User.findByIdAndUpdate(userId,{
       onlineStatus:true
    })
    if(userId) {
        userSocketmap[userId] = socket.id
        socket.join(userId)
        
    }
    try{
const conversations = await Conversation.find({
    "participents.user":userId
   }).select("_id")
   const conversationIds= conversations.map((c)=>c._id)
   const messages = await Message.find(
    {
        conversationId:{$in:conversationIds},
        senderId:{$ne:userId},
        deliveredTo:{
            $not:{
                $elemMatch:{user:userId}
            }
        }

    }
   )

   for (let msg of messages){
    msg.deliveredTo.push({user:userId,deliveredAt:Date.now()})
    await msg.save();
    io.to(msg.conversationId.toString()).emit("message_deliverd",{messageId:msg._id,deliveredTo:msg.deliveredTo})
   }

    }
    catch(error){
        console.log(error.message)
    }
   

   socket.on("mark_seen",async(data)=>{
       await markSeen(data,io)
   })
    socket.on("join_group",(groupId)=>{
     socket.join(groupId)

    })
    socket.on("leave_group",(groupId)=>{
      socket.leave(groupId)
   
    }) 
    io.emit("getOnlineUsers",Object.keys(userSocketmap))
    socket.on("send_reaction", async(data)=>{
       await updateReaction(data,io)
    } )
    socket.on("disconnect" ,async()=>{
        delete userSocketmap[userId]
       io.emit("getOnlineUsers",Object.keys(userSocketmap))
       await User.findByIdAndUpdate(userId,{
       onlineStatus:false,
       lastSeen:new Date()
       ,},  {$new:true})
    })
})
module.exports={io,app,server,getReceiverSocketId,userSocketmap}
