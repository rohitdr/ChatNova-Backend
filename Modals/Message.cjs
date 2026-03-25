const mongoose = require('mongoose')
const messageSchema = new mongoose.Schema({
      senderId:{
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
      enum:["text","image","video"],
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
     content:{
      type:String
     },
     seenBy:[
      {   
        user:{
           type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        },
       
        seenAt:Date
      }
     ],
     deliveredTo:[
      {   
        user:{
           type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        },
       
        deliveredAt:Date
      }
     ],
     reaction:[
      {
        user:{
           type:mongoose.Schema.Types.ObjectId,
           ref:'User'
        },
       
        emoji:String
      }
     ],
     replyTo:{
      type:mongoose.Schema.Types.ObjectId,
           ref:'message',
           default:null
     },
     deletedFor:[
      {
       type:mongoose.Schema.Types.ObjectId,
           ref:'User',
      }
     ],
     isDeletedForEveryone:{
      type:Boolean,
      default:null
     }

},{timestamps:true})

messageSchema.index({
  conversationId:1,createdAt:-1
})     


message = mongoose.model("message",messageSchema)
module.exports = message