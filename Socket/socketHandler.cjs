const { markSeen, updateReaction } = require("../Controllers/socket.cjs")
const { handleConnection, disconnectHandler } = require("./socketService.cjs")

const onlineUsers=new Map()

const socketHandler = (io,socket)=>{
   const userId = socket.handshake.query.userId 
     if (!userId) {
    socket.disconnect()
    return
     }
   
     //marking the user online and all messages deliverd
     handleConnection(userId,onlineUsers,socket,io)

    socket.on("mark_seen",async(data)=>{
    
       await markSeen(data,io)
   })
      socket.on("join_group",(groupId)=>{

     socket.join(groupId)

    })

    socket.on("typing",({conversationId,userId,name})=>{
    
        socket.to(conversationId).emit("user_typing",{userId,name})

    })
    socket.on("stop_typing",({conversationId,userId})=>{
    
        socket.to(conversationId).emit("user_stop_typing",{userId})

    })
    socket.on("leave_group",(groupId)=>{
      socket.leave(groupId)
   
    }) 
  
      
      socket.on("send_reaction", async(data)=>{
           await updateReaction(data,io)
        } )
        

         socket.on("disconnect" ,async()=>{
           await disconnectHandler(userId,onlineUsers,io)
            })

}
module.exports={socketHandler,onlineUsers}