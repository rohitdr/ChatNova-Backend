const Conversation = require("../Modals/Conversation.cjs");
const User = require("../Modals/User.cjs");
const mongoose = require("mongoose");
const Message = require("../Modals/Message.cjs");
const { getIo } = require("../Socket/socketInstance.cjs");

const asyncHandler = require("../Utils/asyncHandler.cjs");
const cloudinary = require("../Config/Cloudinary.cjs");


//--------------CREATE GROUP-----------------------------
const createGroup = asyncHandler(async (req, res) => {
  const io = getIo();

  const { name, participents, avtar, inviteCode } = req.body;
  const id = req.user.id;

  const user = await User.findById(id).select("name");

  if (!name) {
    return res.status(400).json({
      status: false,
      message: "Group Name required",
    });
  }

  if (!participents || participents.length < 2) {
    return res.status(400).json({
      status: false,
      message: "At least 2 participants required",
    });
  }

  participents.push({
    user: id,
    role: "admin",
  });

  const newGroup = await Conversation.create({
    name,
    avtar,
    participents,
    type: "group",
    createdBy: id,
    inviteCode,
  });

  await Message.create({
    senderId: id,
    conversationId: newGroup._id.toString(),
    text: `${user.name} created the group ${name}`,
    type: "system",
  });

  io.to(id).emit("group_created", newGroup);

  return res.status(200).json({
    status: true,
    message: "Group Created Successfully",
  });
});


// ---------------------ADD MEMBER -----------------------------
const addMember = asyncHandler(async (req, res) => {
  const io = getIo();

  const { participents, tempId } = req.body;

  if (!participents || participents.length < 1) {
    return res.status(400).json({
      status: false,
      message: "At least 1 participants required to Add",
    });
  }

  const userIdS = participents.map((e) => e.user);

  const users = await User.find({ _id: { $in: userIdS } }).select("_id name");

  if (users.length !== userIdS.length) {
    return res.status(404).json({
      status: false,
      message: "Any of the user does not exist ",
    });
  }

  const alreadyExists = req.group.participents.some((p) =>
    participents.some((element) => element.user === p.user.toString())
  );

  if (alreadyExists) {
    return res.status(404).json({
      status: false,
      message: "User is already in group",
    });
  }

  req.group.participents.push(...participents);
  req.group.lastActivity = Date.now();

  await req.group.save();

  const conversation = await Conversation.findById(
    req.group._id.toString()
  ).populate("participents.user", "-password -email -refreshToken -deviceTokens");

  const text = `Admin added ${users.map((u) => u.name).join(", ")}`;

  conversation.lastMessage = {
    text,
    sender: req.user.id,
    createdAt: Date.now(),
  };

  conversation.save();

  const conversationToSend = {
    ...conversation.toObject(),
    ConversationId: conversation._id.toString(),
    lastMessage: conversation.lastMessage,
  };

  const systemMsg = await Message.create({
    senderId: req.user.id,
    conversationId: conversation._id.toString(),
    text,
    type: "system",
  });

  users.forEach((element) => {
    io.to(element._id.toString()).emit("added_to_group", {
      groupId: req.group._id.toString(),
      conversationToSend,
    });
  });

  io.to(req.group._id.toString()).emit("newMessage", {
    ...systemMsg,
    tempId,
    conversationToSend,
  });

  io.to(req.group._id.toString()).emit("member_added", {
    groupId: req.group._id.toString(),
    participents: conversation.participents,
  });

  return res.status(200).json({
    status: true,
    message: req.group,
  });
});


//---------------- REMOVE MEMBER ----------------------------------------
const removeMember = asyncHandler(async (req, res) => {
  const io = getIo();

  const { participents, tempId } = req.body;
  const currentUserId = req.user.id;

  if (!participents?.length) {
    return res.status(400).json({
      status: false,
      message: "At least 1 participants required",
    });
  }

  const isRemovingSelfAdmin = participents.some(
    (p) => p.user === currentUserId
  );

  if (isRemovingSelfAdmin) {
    return res.status(400).json({
      status: false,
      message: "You cannot delete the admin from group",
    });
  }

  const userIds = participents.map((p) => p.user);

  const users = await User.find({ _id: { $in: userIds } }).select("_id name");

  req.group.participents = req.group.participents.filter(
    (p) => !userIds.includes(p.user.toString())
  );

  req.group.lastActivity = Date.now();

  await req.group.save();

  const conversation = await Conversation.findById(req.group._id).populate(
    "participents.user",
    "-password -email -refreshToken -deviceTokens"
  );

  const text = `Admin removed ${users.map((u) => u.name).join(", ")}`;

  conversation.lastMessage = {
    text: `Admin removed ${users.map((u) => u.name).join(" , ")}`,
    sender: currentUserId,
    createdAt: Date.now(),
  };

  conversation.save();

  const conversationToSend = {
    ...conversation.toObject(),
    ConversationId: conversation._id.toString(),
    lastMessage: conversation.lastMessage,
  };

  const systemMsg = await Message.create({
    senderId: currentUserId,
    conversationId: conversation._id.toString(),
    text,
    type: "system",
  });

  users.forEach((u) => {
    io.to(u._id.toString()).emit("removed_from_group", {
      groupId: conversation._id.toString(),
    });
  });

  io.to(conversation._id.toString()).emit("newMessage", {
    ...systemMsg,
    tempId,
    conversationToSend,
  });

  io.to(conversation._id.toString()).emit("remove_member", {
    groupId: req.group._id.toString(),
    participents: conversation.participents,
  });

  return res.status(200).json({
    status: true,
    message: req.group,
  });
});


//-----------------GET GROUP BY ID ----------------------------
const getGroupById = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { conversationId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return res.status(400).json({
      status: false,
      message: "Invalid conversation ID",
    });
  }

  const group = await Conversation.findById(conversationId).populate(
    "participents.user",
    "name email image lastSeen"
  );

  if (!group || group.type !== "group") {
    return res.status(404).json({
      status: false,
      message: "Group not found",
    });
  }

  const isMember = group.participents.some(
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
    group,
  });
});


// -------------------------ALL GROUPS -----------------
const allGroup = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const groups = await Conversation.find({
    type: "group",
    "participents.user": userId,
  })
    .sort({ lastActivity: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit) + 1)
    .lean();

  return res.status(200).json({
    status: true,
    groups: groups,
  });
});


// --------------------------UPDATE GROUP -----------------------
const updateGroup = asyncHandler(async (req, res) => {
  const io = getIo();

  const { name, image, inviteCode } = req.body;

  let group = req.group;
  let updatedFields = [];

  if (name) {
    group.name = name;
    updatedFields.push("name");
  }

  if (image) {
    if (group.avtar?.publicId) {
      await cloudinary.uploader.destroy(group.avtar.publicId);
    }

    group.avtar = image;
    updatedFields.push("image");
  }

  if (inviteCode) {
    group.inviteCode = inviteCode;
    updatedFields.push("inviteCode");
  }

  const updateText = `Admin updated the group ${updatedFields.join(", ")}`;

  await group.save();

  const populatedConversation = await Conversation.findById(
    group._id.toString()
  ).populate("participents.user", "-password -email -refreshToken -deviceTokens");

  const conversationToSend = {
    ...populatedConversation.toObject(),
    ConversationId: group._id,
    lastMessage: {
      text: updateText,
      sender: req.user.id,
      createdAt: Date.now(),
    },
  };

  const systemMsg = await Message.create({
    senderId: req.user.id,
    conversationId: group._id.toString(),
    text: updateText,
    type: "system",
  });

  io.to(group._id.toString()).emit("newMessage", {
    ...systemMsg,
    tempId: "null",
    conversationToSend,
  });

  io.to(group._id.toString()).emit("group_update", populatedConversation);

  return res.status(200).json({
    status: true,
    message: group,
  });
});


// ------------------------DELETE GROUP -------------------------
const deleteGroup = asyncHandler(async (req, res) => {
  const io = getIo();

  await Message.deleteMany({ conversationId: req.body.groupId });
  await Conversation.findByIdAndDelete(req.body.groupId);

  req.group.participents.forEach((p) => {
    io.to(p.user.toString()).emit("group_deleted", {
      groupId: req.body.groupId,
    });
  });

  return res.status(200).json({
    status: true,
    message: "Group and Messages are deleted successfully",
  });
});


//------------------------LEAVE GROUP --------------------------------
const leaveGroup = asyncHandler(async (req, res) => {
  const io = getIo();

  const group = await Conversation.findById(req.body.groupId);
  const user = await User.findById(req.user.id);

  if (!group || !user) {
    return res.status(404).json({
      status: false,
      message: "Invalid request",
    });
  }

  const isMember = group.participents.some(
    (p) =>
      p.user.toString() === req.user.id &&
      p.role === "member"
  );

  if (!isMember) {
    return res.status(404).json({
      status: false,
      message: "You are Not a Member of the Group",
    });
  }

  await Conversation.findByIdAndUpdate(req.body.groupId, {
    $pull: { participents: { user: req.user.id } },
  });

  const populatedConversation = await Conversation.findById(
    group._id.toString()
  ).populate("participents.user", "-password -email -refreshToken -deviceTokens");

  const updateText = `${user.name} Leaved the group`;

  const conversationToSend = {
    ...populatedConversation.toObject(),
    ConversationId: group._id,
    lastMessage: {
      text: updateText,
      sender: req.user.id,
      createdAt: Date.now(),
    },
  };

  const systemMsg = await Message.create({
    senderId: req.user.id,
    conversationId: group._id.toString(),
    text: updateText,
    type: "system",
  });

  io.to(group._id.toString()).emit("newMessage", {
    ...systemMsg,
    tempId: "null",
    conversationToSend,
  });

  io.to(group._id.toString()).emit("group_update", populatedConversation);

  io.to(req.user.id).emit("group_leaved", {
    groupId: group._id.toString(),
  });

  return res.status(200).json({
    status: true,
    message: "You Leaved successfully",
  });
});


//-------------------SEARCH GROUP -----------------------------
const searchGroup = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const search = req.query.search?.trim() || " ";

  const groups = await Conversation.find({
    type: "group",
    name: { $regex: search, $options: "i" },
    "participents.user": userId,
  });

  if (!groups.length) {
    return res.status(404).json({
      status: false,
      message: "No group found",
    });
  }

  return res.status(200).json({
    status: true,
    groups,
  });
});


module.exports = {
  searchGroup,
  deleteGroup,
  updateGroup,
  allGroup,
  getGroupById,
  addMember,
  removeMember,
  createGroup,
  leaveGroup,
};