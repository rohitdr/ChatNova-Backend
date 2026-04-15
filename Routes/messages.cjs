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


// Send message (login required)
router.post(
  "/sendMessage",
  [
    body("conversationId", "Invalid conversationId")
      .isMongoId(),

    body("message")
      .isString()
      .trim()
      .isLength({ min: 1, max: 2000 }),

    body("tempId")
      .isString()
      .notEmpty(),

    body("replyTo")
      .optional()
      .isObject(),

    body("replyTo.messageId")
      .optional()
      .isMongoId(),

    body("replyTo.text")
      .optional()
      .isString(),

    body("replyTo.type")
      .optional()
      .isIn(["text", "image", "video"]),
  ],
  fetchUser,
  handleValidation,
  sendMessage
);


// Receive messages (login required)
router.get(
  "/recieveMessage/:conversationId",
  [
    param("conversationId", "Invalid conversationId")
      .isMongoId(),

    query("cursor", "Cursor must be a valid date")
      .optional()
      .isISO8601()
  ],
  fetchUser,
  handleValidation,
  recieveMessage
);


// Send file (image/video/file upload)
router.post(
  "/sendFile/:id",
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
      .isString()
      .notEmpty(),
  ],
  fetchUser,
  handleValidation,
  sendFile
);


// Get conversation ID (user/chat start)
router.get(
  "/conversationId/:id",
  [
    param("id", "Invalid receiverId")
      .isMongoId(),
  ],
  fetchUser,
  handleValidation,
  conversationId
);


module.exports = router;