const express = require("express");

const router = express.Router();

const { body } = require("express-validator");
const fetchUser = require("../Middleware/fetchUser.cjs");
const {
  createUser,
  login,
  refress,
  logout,
  forgetPassowrd,
  updatePassword,
  getUser,
  update,
  deviceToken,
} = require("../Controllers/auth.cjs");

//path to create a user, not required access token
router.post(
  "/createUser",
  [
    body("email", "Enter a valid Email").isEmail(),
    body("username", "Enter a valid username").isLength({ min: 8 }),
    body("password", "Password must be of length 8").isLength({ min: 8 }),
  ],
  createUser,
);
//path to login for the user
router.post(
  "/login",
  [
    body("email", "Enter a valid Email").isEmail(),
    body("password", "Password must of length 8").isLength({ min: 8 }),
  ],
  login,
);
// route to get new access token from refress token when it expires
router.post("/refresh", refress);

// route to login access token required

router.post("/logout", fetchUser, logout);

router.put(
  "/forgetPassword",
  [
    body("email", "Please Enter a valid Email").isEmail(),
    body("username", "Username length must be 8 digits").isLength({ min: 8 }),
    body("password", "password must be of length 8").isLength({ min: 8 }),
  ],
  forgetPassowrd,
);
//route to update password of login user no authentication required
router.put(
  "/updatePassword",
  [
    body("oldPassword", "password length should be more than 8").isLength({
      min: 8,
    }),
    body("newPassword", "password length should be more than 8").isLength({
      min: 8,
    }),
  ],
  fetchUser,
  updatePassword,
);

// route to get userDetails token required
router.get("/getUser", fetchUser, getUser);

router.post("/update", fetchUser, update);

router.post("/deviceToken", fetchUser, deviceToken);

module.exports = router;
