const User = require('../Modals/User.cjs')
const Conversation = require('../Modals/Conversation.cjs')
const Message = require('../Modals/Message.cjs')

const handleConnection =async(userId,onlineUsers,socket, io)=>{
 // Upadting users online status in database
  await User.findByIdAndUpdate(userId,{
       onlineStatus:true
    })
    if(userId) {
      const   count = onlineUsers.get(userId) || 0;
  onlineUsers.set(userId, count + 1);
        socket.join(userId)
        
    }
    try{
        // When User connects marking all messages delivered
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
    msg.deliveredTo = msg.deliveredTo || [];

const alreadyDelivered = msg.deliveredTo.find(
  (d) => d.user.toString() === userId
);

if (!alreadyDelivered) {
  msg.deliveredTo.push({
    user: userId,
    deliveredAt: Date.now(),
  });
}

await msg.save();
//sending message to to client 
    io.to(msg.conversationId.toString()).emit("message_deliverd",{messageId:msg._id,deliveredTo:msg.deliveredTo})
   }

    }
    catch(error){
        console.log(error.message)
    }
   

}

const disconnectHandler=async(userId,onlineUsers,socket,io)=>{
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
}

module.exports = {handleConnection,disconnectHandler}