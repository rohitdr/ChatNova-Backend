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
     type:{
      type:String,
      enum:["text","image","video","text","raw"],
      required:true
     },
     text:{
      type:String,
      default:null
     },
     media:{
        url:String,
        publicId:String,
      
    
       
        bytes:String,
     },
     status:{
      type:String,
      enum:
      ["sent","delivered","seen"]
     }

    

},{timestamps:true})

message = mongoose.model("message",messageSchema)
module.exports = message