const jwt = require('jsonwebtoken')

const fetchUser =(req,res,next)=>{
try{
 const authHeader = req.headers.authorization


 if(!authHeader){
      return res.status(403).json({status:false,message:"Please login to continue"})
 }
 const token =authHeader.split(" ")[1]

 const data = jwt.verify(token,process.env.ACCESS_SECRET)
 req.user=data
 next();
}
catch(error)
{
    return res.status(403).json({status:false,message:error.message})
}
}



module.exports=fetchUser



