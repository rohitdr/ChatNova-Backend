const User = require('../Modals/User.cjs')
const Conversation = require('../Modals/Conversation.cjs')
const Message = require('../Modals/Message.cjs')

const handleConnection =async(userId,onlineUsers,socket, io)=>{
 // Upadting users online status in database
 
    if(userId) {
      const   count = onlineUsers.get(userId) || 0;
  onlineUsers.set(userId, count + 1);
        socket.join(userId)
        
    }
    
       io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
    try{
      const now = Date.now()
        // When User connects marking all messages delivered
const conversations = await Conversation.find({
    "participents.user":userId
   }).select("_id")
   const conversationIds= conversations.map((c)=>c._id)
   await Message.updateMany(
    {
        conversationId:{$in:conversationIds},
        senderId:{$ne:userId},
       deliveredTo: {
      $not: {
        $elemMatch: { user: userId }
      }
    }

    },{
      $push:{
        deliveredTo:{user:userId,deliveredAt:now}
      }
    }
   )

conversationIds.forEach(convId => {

     io.to(convId.toString()).emit("message_deliverd", {
      convId,
      userId,
      deliveredAt: now,
    });
});

          
    }
    catch(error){
        console.log(error.message)
    }
   

}

const disconnectHandler=async(userId,onlineUsers,io)=>{
  setTimeout(async() => {
      const count = onlineUsers.get(userId) || 0;
     if (count <= 1) {
    onlineUsers.delete(userId);

     
  } else {
    onlineUsers.set(userId, count - 1);
  }
    io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
      await User.findByIdAndUpdate(userId,{
               onlineStatus:false,
               lastSeen:new Date()
               ,},  {$new:true})
  }, 1500);
  
}

module.exports = {handleConnection,disconnectHandler}