const mongoose = require('mongoose')
const messageSchema = new mongoose.Schema({
      senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
      },
      receiverId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
      },
      conversationId:{
       type:mongoose.Schema.Types.ObjectId,
        ref:"conversation"
      },
      message:{
        type:String,
        required:true
      }
    

},{timestamps:true})

message = mongoose.model("message",messageSchema)
module.exports = message