const express = require("express");
const router = express.Router();

const { body } = require("express-validator");

const fetchUser = require("../Middleware/fetchUser.cjs");
const handleValidation = require("../Middleware/handleValidation.cjs");

const {
  createUser,
  login,
  refresh,
  logout,
  forgetPassowrd,
  updatePassword,
  getUser,
  update,
  deviceToken,
} = require("../Controllers/auth.cjs");
const  rateLimiter  = require("../Middleware/rateLimiter.cjs");


// Create user (no auth required)
router.post(
  "/createUser",
  rateLimiter({ MAX_REQUESTS:5, WINDOW_SIZE:60}),
  [
    body("email", "Enter a valid Email").isEmail(),
    body("username", "Enter a valid username").isLength({ min: 8 }),
    body("password", "Password must be of length 8").isLength({ min: 8 }),
  ],
  handleValidation,
  createUser
);


// Login user
router.post(
  "/login",
//  rateLimiter({ MAX_REQUESTS:5, WINDOW_SIZE:60}),
  [
    body("email", "Enter a valid Email").isEmail(),
    body("password", "Password must of length 8").isLength({ min: 8 }),
  ],
  handleValidation,
  login
);


// Refresh token
router.post("/refresh", rateLimiter({ MAX_REQUESTS:30, WINDOW_SIZE:60}), refresh);


// Logout (auth required)
router.post("/logout",fetchUser, rateLimiter({ MAX_REQUESTS:30, WINDOW_SIZE:60}),  logout);


// Forget password
router.put(
  "/forgetPassword",
   rateLimiter({ MAX_REQUESTS:10, WINDOW_SIZE:60}),
  [
    body("email", "Please Enter a valid Email").isEmail(),
    body("username", "Username length must be 8 digits").isLength({ min: 8 }),
    body("password", "password must be of length 8").isLength({ min: 8 }),
  ],
  handleValidation,
  forgetPassowrd
);


// Update password (auth required)
router.put(
  "/updatePassword",
    fetchUser,
   rateLimiter({ MAX_REQUESTS:10, WINDOW_SIZE:60}),
  [
    body("oldPassword", "password length should be more than 8").isLength({ min: 8 }),
    body("newPassword", "password length should be more than 8").isLength({ min: 8 }),
  ],
  handleValidation,
  updatePassword
);


// Get user details
router.get("/getUser",fetchUser, rateLimiter({ MAX_REQUESTS:30, WINDOW_SIZE:60}), getUser);


// Update user profile
router.post(
  "/update",
  fetchUser,
   rateLimiter({ MAX_REQUESTS:10, WINDOW_SIZE:60}),
  [
    body("email", "Please Enter a valid Email").optional().isEmail(),
    body("username", "name must be of more than 7").optional().isLength({ min: 8 }),
    body("name", "name must be of more than 3").optional().isLength({ min: 3 }),
    body("phone_number", "Enter valid Indian phone number")
      .optional()
      .isMobilePhone("en-IN"),
  ],
  handleValidation,
  update
);


// Save device token
router.post(
  "/deviceToken",
    fetchUser,
   rateLimiter({ MAX_REQUESTS:30, WINDOW_SIZE:60}),
  [
    body("token", "Device token is required").notEmpty()
  ],
  handleValidation,
  deviceToken
);


module.exports = router;