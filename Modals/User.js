const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  phone_number: {
    type: Number,
    required: true,
  },
});
User = mongoose.model("User", UserSchema);
module.exports = User;
