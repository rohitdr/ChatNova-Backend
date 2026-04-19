const express = require("express");
const router = express.Router();

const fetchUser = require("../Middleware/fetchUser.cjs");
const handleValidation = require("../Middleware/handleValidation.cjs");

const {
  sendMessage,
  recieveMessage,
  sendFile,
  conversationId,
  replyMessage
} = require("../Controllers/messages.cjs");

const { body, query, param } = require("express-validator");
const  rateLimiter  = require("../Middleware/rateLimiter.cjs");


// Send message (login required)
router.post(
  "/sendMessage",
  fetchUser,
  rateLimiter({ MAX_REQUESTS:30, WINDOW_SIZE:60}),
  [
    body("conversationId", "Invalid conversationId")
      .isMongoId(),

    body("message","Enter a valid Mesage")
      .isString()
      .trim()
      .isLength({ min: 1, max: 2000 }),

    body("tempId","Enter a valid temp Id")
      .notEmpty(),

    body("replyTo","ReplyTo should be a object")
      .optional({nullable:true})
      .isObject(),

    body("replyTo.messageId","Invalid MongoId")
      .optional()
      .isMongoId(),

    body("replyTo.text","Enter a valid text")
      .optional()
      .isString(),

    body("replyTo.type","Enter a valid type")
      .optional()
      .isIn(["text", "image", "video"]),
  ],
  handleValidation,
  sendMessage
);


// Receive messages (login required)
router.get(
  "/recieveMessage/:conversationId",
  fetchUser,
  [
    param("conversationId", "Invalid conversationId")
      .isMongoId(),

    query("cursor", "Cursor must be a valid date")
      .optional()
      .isISO8601()
  ],
  handleValidation,
  recieveMessage
);


// Send file (image/video/file upload)
router.post(
  "/sendFile/:id",
  fetchUser,
  rateLimiter({ MAX_REQUESTS:30, WINDOW_SIZE:60}),
  [
    param("id", "Invalid conversationId")
      .isMongoId(),

    body("type", "Enter valid file type")
      .isIn(["image", "video", "file"]),

    body("url", "Enter valid URL")
      .isURL(),

    body("publicId", "Enter valid public Id")
      .isString()
      .notEmpty(),

    body("bytes", "Enter valid bytes")
      .isNumeric()
      .isInt({ min: 1, max: 10 * 1024 * 1024 }),

    body("tempId", "Enter valid tempId")
     
      .notEmpty(),
  ],
  handleValidation,
  sendFile
);


// Get conversation ID (user/chat start)
router.get(
  "/conversationId/:id",
  fetchUser,
  [
    param("id", "Invalid receiverId")
      .isMongoId(),
  ],
  handleValidation,
  conversationId
);


module.exports = router;