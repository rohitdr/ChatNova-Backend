const {Server} =require("socket.io")
const express = require('express')
const http = require('http')
const  cors = require("cors");
const app =express();
const server = http.createServer(app)
const User = require('../Modals/User.cjs')
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
    socket.on("join_group",(groupId)=>{
     socket.join(groupId)
     console.log("room joined " + groupId)
    })
    socket.on("leave_group",(groupId)=>{
      socket.leave(groupId)
      console.log("room leaved " + groupId)
    }) 
    io.emit("getOnlineUsers",Object.keys(userSocketmap))
    // socket.on("sendReaction", updateReacion )
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
