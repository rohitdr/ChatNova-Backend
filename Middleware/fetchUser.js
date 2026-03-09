const jwt = require('jsonwebtoken')

const fetchUser =(req,res,next)=>{
try{
 const token = req.header('access_token')
 if(!token){
      return res.status(404).json({status:false,message:"Please login to continue"})
 }
 const data = jwt.verify(token,process.env.ACCESS_SECRET)
 req.user=data
 next();
}
catch(error)
{
    return res.status(500).json({status:false,message:error})
}
}



module.exports=fetchUser



