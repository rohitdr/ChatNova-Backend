const { validationResult } = require("express-validator");

const handleValidation=(req,res,next)=>{
 const errors = validationResult(req)
          if(!errors.isEmpty()){
              console.log(errors)
                 return res.status(400).json({ status:false,message:errors.array()[0].msg})
          }

    next();
}
module.exports=handleValidation