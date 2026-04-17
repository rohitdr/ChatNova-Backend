const Conversation = require("../Modals/Conversation.cjs");
const Message = require("../Modals/Message.cjs");
const User = require("../Modals/User.cjs");

const sendNotification = require("../Utils/sendNotification.cjs");
const asyncHandler = require("../Utils/asyncHandler.cjs");

const { getIo } = require("../Socket/socketInstance.cjs");
const { onlineUsers } = require("../Socket/socketHandler.cjs");


// ----------------- SEND MESSAGE ----------------------

const sendMessage = asyncHandler(async (req, res) => {
  const io = getIo();

  const { message, conversationId, tempId, replyTo } = req.body;
  const senderId = req.user.id;

  if (replyTo?.messageId) {
    const originalMessage = await Message.findById(replyTo.messageId);

    if (!originalMessage) {
      return res.status(400).json({
        status: false,
        message: "Original message not found"
      });
    }
  }

  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    return res.status(404).json({
      status: false,
      message: "Converation not found"
    });
  }

  const isMember = conversation.participents.some(
    p => p.user.toString() === senderId
  );

  if (!isMember) {
    return res.status(404).json({
      status: false,
      message: "Not allowed"
    });
  }

  const populatedConversation = await Conversation.findById(conversation._id)
    .populate("participents.user", "-password -email -refreshToken -deviceTokens");

  const messageSaved = await Message.create({
    senderId: senderId,
    conversationId: conversation._id,
    text: message,
    type: "text",
    replyTo: replyTo || null
  });

  await Conversation.updateOne(
    { _id: conversationId },
    {
      $set: {
        lastMessage: {
          text: message,
          sender: senderId,
          createdAt: Date.now(),
          replyTo: replyTo
            ? { text: replyTo.text, type: replyTo.type }
            : null,
        },
      },
      $inc: {
        "participents.$[elem].unreadCount": 1,
      },
    },
    {
      arrayFilters: [{ "elem.user": { $ne: senderId } }],
    }
  );

  const conversationToSend = {
    ...populatedConversation.toObject(),
    ConversationId: conversation._id,
    lastMessage: {
      text: message,
      sender: senderId,
      createdAt: Date.now(),
      replyTo: replyTo
        ? { text: replyTo.text, type: replyTo.type }
        : null,
    }
  };



  const receivers = conversation.participents
    .map(p => p.user.toString())
    .filter(id => id !== senderId);

  const onlineReceiverIds = receivers.filter(id =>
    onlineUsers.has(id)
  );

  const offlineReceiverIds = receivers.filter(
    id => !onlineUsers.has(id)
  );

  if (onlineReceiverIds.length) {
   
    const m=await Message.updateOne(
      { _id: messageSaved._id.toString() },
      {
        $addToSet: {
          deliveredTo: {
            $each: onlineReceiverIds.map(id => ({
              user: id,
              deliveredAt: new Date(),
            })),
          },
        },
      }
    );
      console.log(m)
  }

  const newMessage = await Message.findById(messageSaved._id.toString())
    .populate("senderId", "-password -deviceTokens -refreshToken")
    .lean();
  onlineReceiverIds.forEach(id => {
    io.to(id).emit("newMessage", {
      ...newMessage,
      tempId,
      conversationToSend
    });
  });

  const offlineUsers = await User.find(
    { _id: { $in: offlineReceiverIds } },
    { deviceTokens: 1 }
  ).lean();

  const tokens = offlineUsers.flatMap(u => u.deviceTokens || []);

  if (tokens.length) {
    await sendNotification(message, newMessage.senderId.name, tokens);
  }

  conversation.participents.forEach(p => {
    io.to(p.user.toString()).emit("newMessage", {
      ...newMessage,
      tempId,
      conversationToSend
    });
  });

  io.to(conversation._id.toString()).emit("newMessage", {
    ...newMessage,
    tempId,
    conversationToSend
  });

  return res.status(200).json({
    status: true,
    message: newMessage
  });
});


// ----------------- RECEIVE MESSAGE ----------------------

const recieveMessage = asyncHandler(async (req, res) => {
  const id = req.user.id;
  const { cursor } = req.query;
  const conversationId = req.params.conversationId;

  const query = { conversationId };

  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    return res.status(404).json({
      status: false,
      message: "Conversation not found"
    });
  }

  const isMember = conversation.participents.some(
    p => p.user.toString() === id
  );

  if (!isMember) {
    return res.status(404).json({
      status: false,
      message: "Not allowed"
    });
  }

  if (cursor) {
    const date = new Date(cursor);

    if (!isNaN(date.getTime())) {
      query.createdAt = { $lt: date };
    }
  }

  const messages = await Message.find(query)
    .populate("senderId", "-password -refreshToken -email -deviceTokens")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
const totalCount = await Message.countDocuments({ conversationId });
  const nextCursor =
    messages.length > 0
      ? messages[messages.length - 1].createdAt
      : null;

  return res.status(200).json({
    status: true,
    message: messages,
    nextCursor,
    totalCount
  });
});


// ----------------- SEND FILE ----------------------

const sendFile = asyncHandler(async (req, res) => {
  const io = getIo();

  const { type, url, publicId, bytes, tempId } = req.body;
  const senderId = req.user.id;

  const sender = await User.findById(senderId);

  const chat = await Conversation.findById(req.params.id);

  if (!chat) {
    return res.status(404).json({
      status: false,
      message: "Conversation id is not valid"
    });
  }

  const messageSaved = new Message({
    senderId,
    conversationId: chat._id,
    type,
    media: {
      url,
      publicId,
      bytes,
    },
  });

  const populatedConversation = await Conversation.findById(chat._id)
    .populate("participents.user", "-password -email -refreshToken -deviceTokens");

  chat.lastMessage = {
    text: `New ${type}`,
    sender: senderId,
    createdAt: Date.now(),
  };

  chat.participents = chat.participents.map(p => {
    if (p.user.toString() !== senderId) {
      p.unreadCount = (p.unreadCount || 0) + 1;
    }
    return p;
  });

  await chat.save();

  const conversationToSend = {
    ...populatedConversation.toObject(),
    ConversationId: chat._id,
    lastMessage: {
      text: `New ${type}`,
      sender: senderId,
      createdAt: Date.now(),
    }
  };

  const receivers = chat.participents
    .map(p => p.user.toString())
    .filter(p => p !== senderId);

  receivers.forEach(id => {
    if (onlineUsers.has(id)) {
      const alreadyDelivered = messageSaved.deliveredTo.some(
        d => d.user.toString() === id
      );

      if (!alreadyDelivered) {
        messageSaved.deliveredTo.push({
          user: id,
          deliveredAt: Date.now()
        });
      }
    }
  });

  await messageSaved.save();

  const newMessage = await Message.findById(messageSaved._id.toString())
    .populate("senderId", "-password -deviceTokens -refreshToken")
    .lean();

  io.to(chat._id.toString()).emit("newMessage", {
    ...newMessage,
    tempId,
    conversationToSend
  });

  return res.status(200).json({
    status: true,
    message: newMessage
  });
});


// ----------------- CONVERSATION ID ----------------------

const conversationId = asyncHandler(async (req, res) => {
  const senderId = req.user.id;
  const receiverId = req.params.id;

  if (!receiverId) {
    return res.status(404).json({
      status: false,
      message: "Please choose a person to Chat"
    });
  }

  let chat = await Conversation.findOne({
    type: "private",
    "participents.user": { $all: [senderId, receiverId] },
    participents: { $size: 2 }
  });

  if (!chat) {
    chat = await Conversation.create({
      type: "private",
      participents: [
        { user: senderId },
        { user: receiverId }
      ],
    });
  }

  return res.status(200).json({
    status: true,
    conversation: chat
  });
});


// ----------------- EXPORTS ----------------------

module.exports = {
  sendFile,
  sendMessage,
  recieveMessage,
  conversationId
};