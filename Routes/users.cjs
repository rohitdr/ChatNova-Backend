const express = require('express');
const router = express.Router();

const fetchUser = require('../Middleware/fetchUser.cjs');
const handleValidation = require('../Middleware/handleValidation.cjs');

const {
  chattedUsers,
  searchUser,
  getUserById
} = require('../Controllers/users.cjs');

const { query, param } = require('express-validator');


// GET chatted users (pagination required)
router.get(
  '/chattedUsers',
  [
    query("page", "Enter valid page number")
      .isInt({ min: 1 })
      .toInt(),

    query("limit", "Enter valid limit")
      .isInt({ min: 1, max: 100 })
      .toInt()
  ],
  fetchUser,
  handleValidation,
  chattedUsers
);


// Search user (name / username / phone)
router.get(
  '/search',
  [
    query("search", "Enter search value")
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
  ],
  fetchUser,
  handleValidation,
  searchUser
);


// Get user by ID
router.get(
  '/getUser/:id',
  [
    param("id", "Invalid user ID")
      .isMongoId()
  ],
  fetchUser,
  handleValidation,
  getUserById
);


module.exports = router;