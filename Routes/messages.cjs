const express = require("express");
const fetchUser = require("../Middleware/fetchUser.cjs");
const Conversation = require("../Modals/Conversation.cjs");
const Message = require("../Modals/Message.cjs");
const { getReceiverSocketId, io } = require("../Socket/Socket.cjs");
const sendNotification = require("../Utils/sendNotification.cjs");
const router = express.Router();
const User = require("../Modals/User.cjs");

// route to send messages login required
router.post("/sendMessage", fetchUser, async (req, res) => {
  try {
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
    conversation.participents.forEach(  p=>{
      // if(p.user.toString() !== senderId){
  io.to(p.user.toString()).emit("newMessage",{...newMessage,tempId,conversationToSend})

  
    // if (receiver.deviceTokens?.length) {
    //   await sendNotification(message, sender.name, receiver);
    // }
      // }

  })
    //socket implementation
    // io.to(receiverId).emit("newMessage", newMessage);
    // io.to(senderId).emit("newMessage", newMessage);


    return res.status(200).json({ status: true, message: newMessage });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: false, message: error.message });
  }
});

//route to receive message login required
router.get("/recieveMessage/:conversationId", fetchUser, async (req, res) => {
  try {
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
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: false, message: error.message });
  }
});

// route for sending uploading images files and videos
router.post("/sendFile/:id", fetchUser, async (req, res) => {
  try {
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
  chat.participents.forEach(  p=>{
      // if(p.user.toString() !== senderId){
  io.to(p.user.toString()).emit("newMessage",{...newMessage,tempId,conversationToSend})

  
    // if (receiver.deviceTokens?.length) {
    //   await sendNotification(message, sender.name, receiver);
    // }
      // }

  })
    // io.to(receiverId).emit("newMessage", newMessage);
    // io.to(senderId).emit("newMessage", newMessage);

    return res.status(200).json({ status: true, message: newMessage });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: false, message: error.message });
  }
});
//route to get conversation id 
// // check it once after group completed 
router.get("/conversationId/:id", fetchUser, async (req, res) => {
  try {
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
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: false, message: error.message });
  }
});

module.exports = router;
