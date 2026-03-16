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

  },
  refress_token:{
type:String
  },
  onlineStatus:{
    type:Boolean
  },
  deviceTokens:{
    type:[String],
    default:[]
  },
  image:{
    url:{
         type:String,
         default:"https://res.cloudinary.com/do2twyxai/image/upload/v1773586565/oje7kknlxwfgylu9wwxh.jpg"
    },
    publicId:{
      type:String,

    }
  }
});
User = mongoose.model("User", UserSchema);
module.exports = User;
