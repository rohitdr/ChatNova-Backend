const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    default:"Rohan"
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
    default:7451256253

  },
  refress_token:{
type:String
  },
  onlineStatus:{
    type:Boolean,
    default:false
  },
  deviceTokens:{
    type:[String],
    default:[]
  },
  lastSeen:{
    type:Date,
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
