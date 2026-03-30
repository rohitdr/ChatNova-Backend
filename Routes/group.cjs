const express = require("express");
const fetchUser = require("../Middleware/fetchUser.cjs");
const router = express.Router();
const isGroupAdmin  = require("../Middleware/isGroupAdmin.cjs");

const { createGroup, addMember, removeMember, getGroupById, allGroup, updateGroup, deleteGroup, searchGroup } = require("../Controllers/group.cjs");

router.post("/createGroup", fetchUser,createGroup);
// route to 
router.post("/addMember", fetchUser,isGroupAdmin,addMember);
router.post("/removeMember", fetchUser,isGroupAdmin, removeMember);
//router to get group informaton group admin not required
router.get("/getGroupById/:conversationId", fetchUser,getGroupById);

// route to get all the groups on logged in user
router.get("/allgroups", fetchUser, allGroup);
// route to update group information 
router.put("/groupUpdate", fetchUser,isGroupAdmin,updateGroup);
// route to delete group
router.delete("/delete", fetchUser,isGroupAdmin,deleteGroup);

//route to find group by name
router.get('/search', fetchUser,searchGroup)

module.exports = router;
