const express = require("express");
const fetchUser = require("../Middleware/fetchUser.cjs");
const router = express.Router();
const Conversation = require("../Modals/Conversation.cjs");
const isGroupAdmin  = require("../Middleware/isGroupAdmin.cjs");
const User = require('../Modals/User.cjs')
const mongoose = require('mongoose')
const Message = require('../Modals/Message.cjs');
const { io } = require("../Socket/Socket.cjs");
const asyncHandler = require('../Utils/asyncHandler.cjs')
router.post("/createGroup", fetchUser, asyncHandler( async (req, res) => {
  
    const { name, participents, avtar, inviteCode } = req.body;
    const id = req.user.id;
    if (!name) {
      return res
        .status(404)
        .json({ status: false, message: "Group Name required" });
    }
    if (!participents || participents.length < 2) {
      return res
        .status(404)
        .json({ status: false, message: "At least 2 participants required" });
    }
    participents.push({
      user: id,
      role: "admin",
    });
    const newGroup = await  Conversation.create({
      name,
      avtar,
      participents,
      type: "group",
      createdBy: id,
      inviteCode,
    });
    io.to(id).emit("group_created",newGroup)
    return res.status(200).json({ status: true, message: newGroup });
 
}));
// route to 
router.post("/addMember", fetchUser,isGroupAdmin,asyncHandler( async (req, res) => {
 
    const {  participents } = req.body;
      if (!participents || participents.length < 1) {
      return res
        .status(404)
        .json({ status: false, message: "At least 1 participants required to Add" });
    }
    const userId = participents.map(e=>
       e.user
    )
    const user = await User.find({_id:{$in:userId}}).select("_id")
    if(user.length !== userId.length){
      return res
        .status(404)
        .json({ status: false, message: "Any of the user does not exist " });
    }
    const exist = req.group.participents.some(p=>
     participents.some(element=>
      element.user === p.user.toString()
     )
    
    )
  
    if(exist ){
        return res.status(404).json({status:false,message:"User is already in group"})
    }
    req.group.participents.push(...participents)
            req.group.lastActivity=Date.now()
    await req.group.save()
    const conversation = await Conversation.findById(req.group._id.toString()).populate("participents.user","-password -email -refress_token -deviceTokens")
   
   io.to(req.group._id.toString()).emit("member_added",{groupId:req.group._id.toString(),participents:conversation.participents})
    return res.status(200).json({ status: true, message: req.group });
 
}));
router.post("/removeMember", fetchUser,isGroupAdmin, asyncHandler(async (req, res) => {

    const { participents } = req.body;
    const id = req.user.id;
    if (!participents || participents.length < 1) {
      return res
        .status(404)
        .json({ status: false, message: "At least 1 participants required" });
    }
    const admindelete = participents.some(p=>
      p.user === id
    )
    if(admindelete){
       return res
        .status(404)
        .json({ status: false, message: "You cannot delete the admin from group" });
    }
    const userId = participents.map(e=>
       e.user
    )
   
    const user = await User.find({_id:{$in:userId}}).select("_id")
    if(user.length !== userId.length){
      return res
        .status(404)
        .json({ status: false, message: "Any of the user does not exist " });
    }
 
     req.group.participents = req.group.participents.filter(
      p => !userId.includes(p.user.toString())
    );
    req.group.lastActivity=Date.now()
  await req.group.save()
        const conversation = await Conversation.findById(req.group._id.toString()).populate("participents.user","-password -email -refress_token -deviceTokens")

   io.to(req.group._id.toString()).emit("remove_member",{groupId:req.group._id.toString(),participents:conversation.participents})
    return res.status(200).json({ status: true, message:req.group  });
 
}));
//router to get group informaton group admin not required
router.get("/getGroupById/:conversationId", fetchUser, asyncHandler(async (req, res) => {

    const id = req.user.id;
    const conversationId=req.params.conversationId
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(404).json({
        status: false,
        message: "Invalid conversation ID",
      });
    }

    // ✅ Fetch group
    const conversation = await Conversation.findById(conversationId)
      .populate("participents.user", "name email image lastSeen");

    if (!conversation || conversation.type !== "group") {
      return res.status(404).json({
        status: false,
        message: "Group not found",
      });
    }
   const isMember = conversation.participents.some(p=>
    p.user._id.toString()===id
   )  
   if(!isMember){
        return res.status(404).json({status:false,message:"Not allowed to do this"})

   }
   
   
   
    return res.status(200).json({ status: true, message:conversation });
 
}));

// route to get all the groups on logged in user
router.get("/allgroups", fetchUser, asyncHandler(async (req, res) => {
 
    const id = req.user.id;
    

    // ✅ Fetch group
    const groups = await Conversation.find({
    type:"group",
    "participents.user":id
  }).sort({lastActivity:-1})
     

   
    return res.status(200).json({ status: true, groups:groups });

}));
// route to update group information 
router.put("/groupUpdate", fetchUser,isGroupAdmin,asyncHandler( async (req, res) => {
  
     console.log("hello")
    const {name,image,inviteCode}=req.body
    let group = req.group
    if(name){
      group.name=name
    }
    if(image){
      group.avtar=image
    }
    console.log("hello")

    await group.save()
    io.to(group._id.toString()).emit("group_update",group)

   
    return res.status(200).json({ status: true, message:group });

}));
// route to delete group
router.delete("/delete", fetchUser,isGroupAdmin,asyncHandler( async (req, res) => {
  
      await Message.deleteMany({conversationId:req.body.groupId})
      await Conversation.findByIdAndDelete(req.body.groupId)
    return res.status(200).json({ status: true, message:"Group and Messages are deleted successfully" });
 
}));

//route to find group by name
router.get('/search', fetchUser,asyncHandler(async(req,res)=>{
  
        const currentId=req.user.id;
          const search = req.query.search || " "
      const groups = await Conversation.find({
  type: "group",
  name: { $regex: search, $options: "i" },
  "participents.user": currentId
});
        if(groups.length === 0){
            return res.status(404).json({status:false,message:"No group found"})
        }
        return res.status(200).json({status:true,groups})
  
}))

module.exports = router;
