
const express = require('express');
const fetchUser = require('../Middleware/fetchUser.cjs');
const router = express.Router();

const { chattedUsers, searchUser, getUserById } = require('../Controllers/users.cjs');


router.get('/chattedUsers', fetchUser,chattedUsers)


//route to search user with name , username ,phonenumber login required
router.get('/search', fetchUser,searchUser)

//route to get user by id
// route to get userDetails token required
router.get('/getUser/:id',fetchUser,getUserById)








module.exports = router