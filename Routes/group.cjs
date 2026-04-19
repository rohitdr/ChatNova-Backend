const express = require("express");
const fetchUser = require("../Middleware/fetchUser.cjs");

const router = express.Router();
const isGroupAdmin = require("../Middleware/isGroupAdmin.cjs");

const {
  createGroup,
  addMember,
  removeMember,
  getGroupById,
  allGroup,
  updateGroup,
  deleteGroup,
  searchGroup,
  leaveGroup,
} = require("../Controllers/group.cjs");

const handleValidation = require("../Middleware/handleValidation.cjs");
const { body, param, query } = require("express-validator");
const rateLimiter = require("../Middleware/rateLimiter.cjs");


// ======================= CREATE GROUP =======================
router.post(
  "/createGroup",
    fetchUser,
 rateLimiter({ MAX_REQUESTS:30, WINDOW_SIZE:60}),
  [
    body("name", "Group name must be at least 3 characters").isLength({ min: 3 }),
    body("inviteCode", "InviteCode must be at least 3 characters").isLength({ min: 3 }),

    body("participents", "Participents must be an array").isArray({ min: 1 }),
    body("participents.*.user", "Invalid UserId").isMongoId(),
    body("participents.*.role", "Role must be member or Admin").isIn(["member", "admin"]),

    body("avtar", "Avtar must be an object").isObject(),
    body("avtar.url", "url must be a string").isURL(),
    body("avtar.publicId", "public id cannot empty").notEmpty().isString(),
  ],
  handleValidation,
  createGroup
);


// ======================= ADD MEMBER =======================
router.post(
  "/addMember",
  fetchUser,
  rateLimiter({ MAX_REQUESTS:30, WINDOW_SIZE:60}),
  [
    body("participents", "Participents must be an array").isArray({ min: 1 }),
    body("participents.*.user", "Invalid UserId").isMongoId(),
    body("participents.*.role").isIn(["member", "admin"]),
    body("tempId", "tempId must not be empty").notEmpty(),
  ],
  isGroupAdmin,
  handleValidation,
  addMember
);


// ======================= REMOVE MEMBER =======================
router.post(
  "/removeMember",
  fetchUser,
  rateLimiter({ MAX_REQUESTS:30, WINDOW_SIZE:60}),
  [
    body("participents", "Participents must be an array").isArray({ min: 1 }),
    body("participents.*.user", "Invalid UserId").isMongoId(),

    body("tempId", "tempId must not be empty").notEmpty(),
  ],
  isGroupAdmin,
  handleValidation,
  removeMember
);


// ======================= GET GROUP BY ID =======================
router.get(
  "/getGroupById/:conversationId",
  fetchUser,
  [
    param("conversationId", "ConversationId cannot be empty").isMongoId(),
  ],
  handleValidation,
  getGroupById
);


// ======================= ALL GROUPS =======================
router.get("/allgroups", fetchUser, allGroup);


// ======================= UPDATE GROUP =======================
router.put(
  "/groupUpdate",
  fetchUser,
   rateLimiter({ MAX_REQUESTS:30, WINDOW_SIZE:60}),
  [
    body("name", "Group name must be at least 3 characters")
      .optional()
      .isLength({ min: 3 }),

    body("inviteCode", "InviteCode must be at least 3 characters")
      .optional()
      .isLength({ min: 3 }),

    body("image", "Avtar must be an object").optional().isObject(),
    body("image.publicId").optional().isString(),
    body("image.url").optional().isURL(),
  ],
  isGroupAdmin,
  handleValidation,
  updateGroup
);


// ======================= DELETE GROUP =======================
router.delete(
  "/delete",
  fetchUser,
   rateLimiter({ MAX_REQUESTS:30, WINDOW_SIZE:60}),
  [
    body("groupId", "Invalid GroupId").isMongoId(),
  ],
  isGroupAdmin,
  handleValidation,
  deleteGroup
);


// ======================= SEARCH GROUP =======================
router.get(
  "/search",
  fetchUser,
   rateLimiter({ MAX_REQUESTS:30, WINDOW_SIZE:60}),
  [
    query("search", "Search Input cannot be empty").notEmpty(),
  ],
  handleValidation,
  searchGroup
);


// ======================= LEAVE GROUP =======================
router.patch(
  "/leaveGroup",
  fetchUser,
  rateLimiter({ MAX_REQUESTS:30, WINDOW_SIZE:60}),
  [
    body("groupId", "Invalid GroupId").isMongoId(),
  ],
  handleValidation,
  leaveGroup
);


module.exports = router;