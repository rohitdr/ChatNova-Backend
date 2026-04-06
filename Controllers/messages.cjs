
const Conversation = require("../Modals/Conversation.cjs");
const Message = require("../Modals/Message.cjs");


const { getIo } = require('../Socket/socketInstance.cjs');



const User = require("../Modals/User.cjs");
const  asyncHandler  = require("../Utils/asyncHandler.cjs");
const { onlineUsers } = require("../Socket/socketHandler.cjs");

// route to send messages login required
const sendMessage=asyncHandler(async (req, res) => {
  const io=getIo()
    const {  message, conversationId,tempId,replyTo } = req.body;
    const senderId = req.user.id;

    let conversation;
    if (replyTo?.messageId) {
  const originalMessage = await Message.findById(replyTo.messageId);

  if (!originalMessage) {
    return res.status(400).json({
      status: false,
      message: "Original message not found"
    });
  }
}
    // if conversation id is their
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return res
          .status(404)
          .json({ status: false, message: "Converation not found" });
      }
     const isMember = conversation.participents.some(
      p=>p.user.toString() === senderId
     )
     if(!isMember){
       return res
          .status(404)
          .json({ status: false, message: "Not allowed" });
     }
    } 
    
    else{
       return res
          .status(404)
          .json({ status: false, message: "Conversation or Reciver id is required" });
    }
const populatedConversation = await Conversation.findById(conversation._id).populate("participents.user","-password -email -refress_token -deviceTokens")
 

let messageSaved =await Message.create({
      senderId:senderId,
      conversationId:conversation._id,
      text: message,
      type: "text",
      replyTo:replyTo || null
    });
  
    conversation.lastMessage={
      text:message,
      sender:senderId,
      createdAt:Date.now(),
      replyTo: replyTo ? {
    text: replyTo.text,
    type: replyTo.type
  } : null
    }
    conversation.participents.map((p)=>{
      if(p.user.toString()!==senderId){
        p.unreadCount = (p.unreadCount || 0)+1
      }
      return p
    })
    await conversation.save()
    const conversationToSend={
       ...populatedConversation.toObject(),
        ConversationId:conversation._id,
        lastMessage:{
           text:message,
      sender:senderId,
      createdAt:Date.now(),
         replyTo: replyTo ? {
    text: replyTo.text,
    type: replyTo.type
  } : null
        }
    }
    const recievers = conversation.participents
    .map((p)=>p.user.toString() )
    .filter((p)=>p !== senderId)
    recievers.forEach(element => {
      if(onlineUsers.has(element))
      {
        const alreadydeliverd = messageSaved.deliveredTo.some((d)=>
        d.user.toString() === element
        )
        if(!alreadydeliverd){
          messageSaved.deliveredTo.push({user:element,deliveredAt:Date.now()})
        }
      }
       
    });
         await messageSaved.save()

    // if (receiver.deviceTokens?.length) {
    //   await sendNotification(message, sender.name, receiver);
    // }
      // }
      let newMessage = await Message.findById(messageSaved._id.toString()).populate("senderId"," -password -deviceTokens -refress_token").lean()
      //sending message to all the participents of group
conversation.participents.forEach((p)=>{
    io.to(p.user.toString()).emit("newMessage",{...newMessage,tempId,conversationToSend})
})
    io.to(conversation._id.toString()).emit("newMessage",{...newMessage,tempId,conversationToSend})
   

    return res.status(200).json({ status: true, message: newMessage });
 
});

//route to receive message login required
const recieveMessage=asyncHandler(async (req, res) => {

    const id =req.user.id
    const {limit,page}=req.query
    const conversationId = req.params.conversationId
  
  const conversation = await Conversation.findById(conversationId)
  if(!conversation){
    return res.status(404).json({status:false,message:"Conversation not found"})
  }
  const isMember = conversation.participents.some(p=>
    p.user.toString()===id
  )
   if(!isMember){
       return res
          .status(404)
          .json({ status: false, message: "Not allowed" });
     }
     const messages = await Message.find({
      conversationId:conversationId
     }).populate("senderId","-password -refress_token -email -deviceTokens").sort({createdAt:-1})
     .skip((page-1)*limit)
     .limit(Number(limit+1))
     if(!messages){
        return res
          .status(404)
          .json({ status: false, message: "Messages are not avialable" });
     }
    const hasMore = messages.length>limit
     const finalmessages = hasMore?messages.slice(0,limit):messages
  
    return res.status(200).json({ status: true, message:finalmessages,page:page,hasMore});
 
});

// route for sending uploading images files and videos
const sendFile=asyncHandler( async (req, res) => {
  const io=getIo()
    const { type, url, publicId, bytes,tempId } = req.body;
       const senderId=req.user.id
       const sender = await User.findById(senderId)
    let chat = await Conversation.findById(req.params.id)
    if (!chat) {
     return res.status(404).json({status:false,message:"Conversation id is not valid"})
    }
    let messageSaved = new Message({
      senderId:senderId,
      conversationId: chat._id,
      type,
      media: {
        url,
        publicId,
        bytes,
      },
      
    });
    
    //socket
const populatedConversation = await Conversation.findById(chat._id).populate("participents.user","-password -email -refress_token -deviceTokens")

chat.lastMessage={
     text:`New ${type}`,
      sender:senderId,
      createdAt:Date.now(),
     
    }
     chat.participents.map((p)=>{
      if(p.user.toString()!==senderId){
        p.unreadCount = (p.unreadCount || 0)+1
      }
      return p
    })
    await chat.save()
    const conversationToSend={
       ...populatedConversation.toObject(),
        ConversationId:chat._id,
        lastMessage:{
          text:`New ${type}`,
      sender:senderId,
      createdAt:Date.now(),
    
        }
    }
     const recievers = chat.participents
    .map((p)=>p.user.toString() )
    .filter((p)=>p !== senderId)
    recievers.forEach(element => {
      if(onlineUsers.has(element))
      {
        const alreadydeliverd = messageSaved.deliveredTo.some((d)=>
        d.user.toString() === element
        )
        if(!alreadydeliverd){
          messageSaved.deliveredTo.push({user:element,deliveredAt:Date.now()})
        }
      }
       
    });
         await messageSaved.save()
         let newMessage = await Message.findById(messageSaved._id.toString()).populate("senderId"," -password -deviceTokens -refress_token").lean()
  // chat.participents.forEach(  p=>{
      // if(p.user.toString() !== senderId){
  io.to(chat._id.toString()).emit("newMessage",{...newMessage,tempId,conversationToSend})

  
    // if (receiver.deviceTokens?.length) {
    //   await sendNotification(message, sender.name, receiver);
    // }
      // }

  // })
    // io.to(receiverId).emit("newMessage", newMessage);
    // io.to(senderId).emit("newMessage", newMessage);

    return res.status(200).json({ status: true, message: newMessage });
 
});
//route to get conversation id 
// // check it once after group completed 
const conversationId=asyncHandler(async (req, res) => {
 
    const senderId = req.user.id;
    const receiverId = req.params.id;
    if (!receiverId) {
      return res
        .status(404)
        .json({ status: false, message: "Please choose a person to Chat" });
    }
    let chat = await Conversation.findOne({
      type:"private",
      "participents.user": { $all: [senderId, receiverId] },
      participents:{$size:2}
    });
    if (!chat) {
      chat = await Conversation.create({
        type:"private",
        participents: [{user:senderId}, {user:receiverId}],
      });
    }
    return res.status(200).json({ status: true, conversation: chat });
 
});



module.exports = {sendFile,sendMessage,recieveMessage,conversationId};
