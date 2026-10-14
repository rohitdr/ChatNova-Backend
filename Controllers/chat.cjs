const Conversation = require("../Modals/Conversation.cjs");

const mongoose = require("mongoose");


const asyncHandler = require("../Utils/asyncHandler.cjs");

const getConversation = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { conversationId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return res.status(400).json({
      status: false,
      message: "Invalid conversation ID",
    });
  }

  const conversation = await Conversation.findById(conversationId).populate(
    "participents.user",
    "name email image lastSeen"
  );

  if (!conversation) {
    return res.status(404).json({
      status: false,
      message: "Conversation not found",
    });
  }

  const isMember = conversation.participents.some(
    (p) => p.user._id.toString() === userId
  );

  if (!isMember) {
    return res.status(403).json({
      status: false,
      message: "Not allowed to do this",
    });
  }

  return res.status(200).json({
    status: true,
    conversation,
  });
});
module.exports={getConversation}