const Redis = require('ioredis')
const redis=new Redis(process.env.REDIS_URL)
const rateLimiter=(options={})=>{
 const{
 MAX_REQUESTS=10,
 WINDOW_SIZE=60
    } =options

    return async(req,res,next)=>{
        const identifier=req.user?.id || req.ip 
    const key=`rate:${identifier}`
    const now = Date.now()
try{

     await redis.zadd(key,now,now);
     await redis.zremrangebyscore(key,0,now-WINDOW_SIZE*1000)
     const count =await redis.zcard(key);
       await redis.expire(key, WINDOW_SIZE);
     if(count>MAX_REQUESTS){
 return res.status(429).json({
        message: `You’ve hit the limit. Try again in 60 seconds.`,
      });
     }
   

    next();
}
catch(error){
    console.log(error)
    next()
}
}
}
module.exports=rateLimiter