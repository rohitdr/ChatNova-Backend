
const Message = require('../Modals/Message.cjs')
const { io } = require('../Socket/Socket.cjs')
const Conversation = require('../Modals/Conversation.cjs')

const updateReaction =async ({messageId,conversationId,emoji,userId},io)=>{

   const message = await Message.findById(messageId)
   if(!message) return

   const existingRection = message.reaction.find((r)=>
        r.user.toString()===userId
   )
   
   if(existingRection){

    if(existingRection.emoji === emoji){
     
        message.reaction=message.reaction.filter((r)=>
           r.user.toString() !== userId
        )
        console.log(message.reaction)
    }
    else{
    
        existingRection.emoji = emoji

    }
   }
   else{
    console.log("no")
    message.reaction.push({user:userId,emoji:emoji})
   }
     await message.save()
     io.to(conversationId).emit("reaction_updated",{
        messageId,
        reaction :message.reaction

     })

  
}
const markSeen=async({conversationId,userId},io)=>{
const now = new Date()
    await Message.updateMany({
        conversationId,
        senderId:{$ne:userId},
        "seenBy.user":{$ne:userId}
    },
   {
    $addToSet:{
        deliveredTo:{user:userId,deliveredAt:now},
        seenBy:{user:userId,seenAt:now}
    }
   }
)
 io.to(conversationId).emit("message_seen",{conversationId,userId,seenAt:now})
      const conversation = await Conversation.updateOne(
            {_id:conversationId,"participents.user":userId},
       {$set:{"participents.$.lastSeen":now,
         "participents.$.unreadCount":0
        }}
        )

}


module.exports = {updateReaction,markSeen}
