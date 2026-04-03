const Conversation = require('../Modals/Conversation.cjs')

const isGroupAdmin=async(req,res,next)=>{
try{

    const groupId= req.body.groupId

    const group  = await Conversation.findById(groupId)
    if (!group && group.type==="group") {
      return res
        .status(404)
        .json({ status: false, message: "Please choose a valid group" });
    }
    const admin =  group.participents.find(p=>
       p.user.toString() == req.user.id && p.role==="admin"
    )
if(!admin){
       return res
        .status(404)
        .json({ status: false, message: "You are not a admin " });  
}
req.group=group
      next()
}catch(error)
{ console.log(error)
    return res.status(500).json({status:false,message:error.message})
}

  
}


module.exports = isGroupAdmin