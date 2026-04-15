const Message = require("../Modals/Message.cjs");
const Conversation = require("../Modals/Conversation.cjs");


// ----------------- UPDATE REACTION ----------------------

const updateReaction = async (
  { messageId, conversationId, emoji, userId },
  io
) => {
  try {
    if (!messageId || !conversationId || !emoji || !userId) {
      return;
    }

    const message = await Message.findById(messageId);
    if (!message) return;

    const existingReaction = message.reaction.find(
      r => r.user.toString() === userId.toString()
    );

    if (existingReaction) {
      if (existingReaction.emoji === emoji) {
        message.reaction = message.reaction.filter(
          r => r.user.toString() !== userId.toString()
        );
      } else {
        existingReaction.emoji = emoji;
      }
    } else {
      message.reaction.push({
        user: userId,
        emoji: emoji
      });
    }

    await message.save();

    io.to(conversationId).emit("reaction_updated", {
      messageId,
      reaction: message.reaction,
    });

  } catch (error) {
    console.error("Error updating reaction:", error);
  }
};


// ----------------- MARK SEEN ----------------------

const markSeen = async ({ conversationId, userId }, io) => {
  try {
    if (!conversationId || !userId) return;

    const now = new Date();

    await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: userId },
        "seenBy.user": { $ne: userId },
      },
      {
        $addToSet: {
          deliveredTo: {
            user: userId,
            deliveredAt: now
          },
          seenBy: {
            user: userId,
            seenAt: now
          },
        },
      }
    );

    await Conversation.updateOne(
      { _id: conversationId, "participents.user": userId },
      {
        $set: {
          "participents.$.lastSeen": now,
          "participents.$.unreadCount": 0,
        },
      }
    );

    io.to(conversationId).emit("message_seen", {
      conversationId,
      userId,
      seenAt: now,
    });

  } catch (error) {
    console.error("Error marking messages as seen:", error);
  }
};


// ----------------- EXPORTS ----------------------

module.exports = {
  updateReaction,
  markSeen
};