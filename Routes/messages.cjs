const express = require("express");
const fetchUser = require("../Middleware/fetchUser.cjs");
const Conversation = require("../Modals/Conversation.cjs");
const Message = require("../Modals/Message.cjs");
const { getReceiverSocketId,userSocketmap, io } = require("../Socket/Socket.cjs");
const sendNotification = require("../Utils/sendNotification.cjs");
const router = express.Router();
const User = require("../Modals/User.cjs");
const  asyncHandler  = require("../Utils/asyncHandler.cjs");

// route to send messages login required
router.post("/sendMessage", fetchUser,asyncHandler(async (req, res) => {
  
    const { receiverId, message, conversationId,tempId } = req.body;
    const senderId = req.user.id;
    const sender = await User.findById(senderId)
    let conversation;
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
    } else if (receiverId) {
      conversation = await Conversation.findOne({
        type: "private",
        "participents.user": {
          $all: [senderId, receiverId],
        },
        participents: { $size: 2 },
      });
      if (!conversation) {
        conversation = await Conversation.create({
          type: "private",
          participents: [{ user: senderId }, { user: receiverId }],
        });
      }
    }
    else{
       return res
          .status(404)
          .json({ status: false, message: "Conversation or Reciver id is required" });
    }
const populatedConversation = await Conversation.findById(conversation._id).populate("participents.user","-password -email -refress_token -deviceTokens")
 

let newMessage =await Message.create({
      senderId:sender,
      conversationId:conversation._id,
      text: message,
      type: "text",
    });
    conversation.lastMessage={
      text:message,
      sender:senderId,
      createdAt:Date.now()
    }
    await conversation.save()
    const conversationToSend={
       ...populatedConversation.toObject(),
        ConversationId:conversation._id,
        lastMessage:{
           text:message,
      sender:senderId,
      createdAt:Date.now()
        }
    }
    const recievers = conversation.participents
    .map((p)=>p.user.toString() )
    .filter((p)=>p !== senderId)
    recievers.forEach(element => {
      if(userSocketmap[element])
      {
        const alreadydeliverd = newMessage.deliveredTo.some((d)=>
        d.user.toString() === element
        )
        if(!alreadydeliverd){
          newMessage.deliveredTo.push({user:element,deliveredAt:Date.now()})
        }
      }
       
    });
         await newMessage.save()

    // if (receiver.deviceTokens?.length) {
    //   await sendNotification(message, sender.name, receiver);
    // }
      // }

    io.to(conversation._id.toString()).emit("newMessage",{...newMessage,tempId,conversationToSend})
 
  

 
    // io.to(conversation._id.toString()).emit("message_delivered",{messageId:newMessage._id,deliveredTo:newMessage.deliveredTo})
  
  


    return res.status(200).json({ status: true, message: newMessage });
 
}));

//route to receive message login required
router.get("/recieveMessage/:conversationId", fetchUser, asyncHandler(async (req, res) => {

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
  
    return res.status(200).json({ status: true, message:finalmessages,hasMore});
 
}));

// route for sending uploading images files and videos
router.post("/sendFile/:id", fetchUser,asyncHandler( async (req, res) => {
  
    const { type, url, publicId, bytes,tempId } = req.body;
       const senderId=req.user.id
       const sender = await User.findById(senderId)
    let chat = await Conversation.findById(req.params.id)
    if (!chat) {
     return res.status(404).json({status:false,message:"Conversation id is not valid"})
    }
    let newMessage = new Message({
      senderId:sender,
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

    await  newMessage.save()
chat.lastMessage={
     text:`New ${type}`,
      sender:senderId,
      createdAt:Date.now()
    }
    await chat.save()
    const conversationToSend={
       ...populatedConversation.toObject(),
        ConversationId:chat._id,
        lastMessage:{
          text:`New ${type}`,
      sender:senderId,
      createdAt:Date.now()
        }
    }
     const recievers = chat.participents
    .map((p)=>p.user.toString() )
    .filter((p)=>p !== senderId)
    recievers.forEach(element => {
      if(userSocketmap[element])
      {
        const alreadydeliverd = newMessage.deliveredTo.some((d)=>
        d.user.toString() === element
        )
        if(!alreadydeliverd){
          newMessage.deliveredTo.push({user:element,deliveredAt:Date.now()})
        }
      }
       
    });
         await newMessage.save()
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
 
}));
//route to get conversation id 
// // check it once after group completed 
router.get("/conversationId/:id", fetchUser, asyncHandler(async (req, res) => {
 
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
 
}));


module.exports = router;
