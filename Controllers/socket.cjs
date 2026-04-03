
const Message = require('../Modals/Message.cjs')
const { io } = require('../Socket/Socket.cjs')

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

    const messages = await Message.find({
        
            conversationId:conversationId,
        
        senderId:{$ne:userId},
        seenBy:{
            $not:{
                $elemMatch:{user:userId}
            }
        }}
    )
    for (let msg of messages){
        const  existDelivered =  msg.deliveredTo?.some((d)=>
            d.user.toString() ===userId
    )
     if (!msg.deliveredTo) {
    msg.deliveredTo = [];
  }
        if(!existDelivered){
              msg.deliveredTo.push({user:userId,seenAt:Date.now()})
        }
        msg.seenBy.push({user:userId,seenAt:Date.now()})
        await msg.save()
        io.to(conversationId).emit("message_seen",{messageId:msg._id,seenBy:msg.seenBy})
     
    }

}


module.exports = {updateReaction,markSeen}
