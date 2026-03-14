const {Server} =require("socket.io")
const express = require('express')
const http = require('http')

const app =express();
const server = http.createServer(app)
const io = new Server(server,{
       cors:{
        origin:[process.env.FRONTEND_URL],
        methods:["GET","POST"]
    }
})

 const getReceiverSocketId=(receiverId)=>{
        return userSocketmap[receiverId]
}
const userSocketmap={}

io.on("connection",(socket)=>{
    const userId = socket.handshake.query.userId 
    if(userId) {
        userSocketmap[userId] = socket.id
        
    }
    io.emit("getOnlineUsers",Object.keys(userSocketmap))
    socket.on("disconnect" ,()=>{
        delete userSocketmap[userId]
       io.emit("getOnlineUsers",Object.keys(userSocketmap))
    })
})
module.exports={io,app,server,getReceiverSocketId,userSocketmap}
