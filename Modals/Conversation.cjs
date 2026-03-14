const mongoose =require('mongoose')

const conversationSchema = new mongoose.Schema({
    participents:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
    messages:[{
         type:mongoose.Schema.Types.ObjectId,
        ref:"message",
        default:[]
    }]

},{timestamps:true})

conversation = mongoose.model('conversation',conversationSchema)
module.exports = conversation