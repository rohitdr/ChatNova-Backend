const mongoose =require('mongoose')

const conversationSchema = new mongoose.Schema({
    participents:[
        {
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    role:{
        type:String,
        enum:["admin","member"],
      
        required:function (){
            return this.parent().parent().type==="group"
        }
    },
    lastSeen:{
        type:Date,
        default:Date.now()
    },
    unreadCount:{
        type:Number,
        default:0
    }
}],
   
    type:{
        type:String,
        enum:["private","group"],
        default:"private"
    },
    name:{
        type:String,
        required: function (){
         return this.type ==="group"
        }
    },
    avtar:{
        url:{
        type:String,

         required:function () {
            return this.parent().type ==="group"
        }
        },
        publicId:{
            type:String,
      
        },
       
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    lastMessage:{
        text:String,
        sender:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        },
        createdAt:{
            type:Date,
            default:Date.now
        }
    },
    lastActivity:{
        type:Date,
        default:Date.now
    },
    inviteCode:{
        type:String,
        sparse:true,
        required:function () {
            return this.parent().type ==="group"}
    }
   


},{timestamps:true})

conversationSchema.index({
    "participents.user":1
})
conversationSchema.index({
    "participents.user":1,
    lastActivity:-1
})
conversationSchema.index({
    inviteCode:1
},{unique:true})

conversation = mongoose.model('conversation',conversationSchema)
module.exports = conversation