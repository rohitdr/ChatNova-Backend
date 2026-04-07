const mongoose = require('mongoose');
const User = require('../Modals/User.cjs');
const Conversation = require('../Modals/Conversation.cjs');
const asyncHandler = require('../Utils/asyncHandler.cjs');


// -----------------GET LIST OF USERS WHOM CHATTED WITH PRIVATE CONVERSATION---------------------------
const chattedUsers = asyncHandler(async (req, res) => {
    const currentId = new mongoose.Types.ObjectId(req.user.id);
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;

    const conversations = await Conversation.aggregate([
        {
            $match: {
                type: "private",
                "participents.user": currentId,
                "lastMessage.text": { $exists: true },
                $expr: { $eq: [{ $size: "$participents" }, 2] }
            }
        },
        {
            $addFields: {
                me: {
                    $arrayElemAt: [
                        {
                            $filter: {
                                input: "$participents",
                                as: "p",
                                cond: { $eq: ["$$p.user", currentId] }
                            }
                        },
                        0
                    ]
                },
                otherUser: {
                    $arrayElemAt: [
                        {
                            $filter: {
                                input: "$participents",
                                as: "p",
                                cond: { $ne: ["$$p.user", currentId] }
                            }
                        },
                        0
                    ]
                }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "otherUser.user",
                foreignField: "_id",
                as: "otherUserDetails"
            }
        },
        {
            $unwind: "$otherUserDetails"
        },
        {
            $project: {
                conversationId: "$_id",
                lastMessage: 1,
                unreadCount: "$me.unreadCount",
                otherUserDetails: {
                    _id: "$otherUserDetails._id",
                    name: "$otherUserDetails.name",
                    username: "$otherUserDetails.username",
                    image: "$otherUserDetails.image",
                    lastSeen: "$otherUserDetails.lastSeen"
                }
            }
        },
        { $sort: { "lastMessage.createdAt": -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit }
    ]);

    const hasMore = conversations.length >= limit;

    res.status(200).json({
        status: true,
        users: conversations.map(conv => ({
            user: { ...conv.otherUserDetails },
            _id: conv._id,
            ConversationId: conv.conversationId,
            lastMessage: conv.lastMessage,
            lastSeen: conv.otherUserDetails.lastSeen,
            unreadCount: conv.unreadCount || 0
        })),
        pageNum: page,
        hasMore
    });
});


// ---------------------SEARCH USERS BY NAME ----------------------------
const searchUser = asyncHandler(async (req, res) => {
    const currentId = req.user.id;
    const search = req.query.search?.trim() || " ";

    const users = await User.find({
        $and: [
            {
                $or: [
                    { username: { $regex: search, $options: 'i' } },
                    { name: { $regex: search, $options: 'i' } }
                ]
            },
            {
                _id: { $ne: currentId }
            }
        ]
    })
        .select("-password -email -refreshToken -deviceTokens")
        .limit(15)
        .lean();

    if (!users.length) {
        return res.status(404).json({ status: false, message: "No user found" });
    }

    return res.status(200).json({ status: true, users });
});


//-------------------------GET USER BY ID----------------------------
const getUserById = asyncHandler(async (req, res) => {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ status: false, message: "Invalid user ID" });
    }

    const user = await User.findById(id)
        .select("-password -refreshToken -deviceTokens")
        .lean();

    if (!user) {
        return res.status(404).json({ status: false, message: "User does not Exist " });
    }

    res.status(200).json({ status: true, user });
});


module.exports = { chattedUsers, getUserById, searchUser };