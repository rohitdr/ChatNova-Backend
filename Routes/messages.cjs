const express = require("express");
const fetchUser = require("../Middleware/fetchUser.cjs");


const router = express.Router();
const { sendMessage, recieveMessage, sendFile, conversationId, replyMessage } = require("../Controllers/messages.cjs");

// route to send messages login required
router.post("/sendMessage", fetchUser,sendMessage);

//route to receive message login required
router.get("/recieveMessage/:conversationId", fetchUser,recieveMessage);

// route for sending uploading images files and videos
router.post("/sendFile/:id", fetchUser,sendFile);
//route to get conversation id 
// // check it once after group completed 
router.get("/conversationId/:id", fetchUser,conversationId);


module.exports = router;
