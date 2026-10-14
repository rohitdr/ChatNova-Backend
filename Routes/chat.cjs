const express=require('express');
const { getConversation } = require('../Controllers/chat.cjs');
const fetchUser = require("../Middleware/fetchUser.cjs");
const handleValidation = require("../Middleware/handleValidation.cjs");
const { param } = require('express-validator');
const router=express.Router()
router.get(
  "/:conversationId",
  fetchUser,
  [
    param("conversationId", "ConversationId cannot be empty").isMongoId(),
  ],
  handleValidation,
  getConversation
);
module.exports=router