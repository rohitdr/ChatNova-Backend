const {Server} = require('socket.io')
const {socketHandler} = require('./Socket/socketHandler.cjs')
const { setIo } = require('./Socket/socketInstance.cjs')

const initSocket = (server)=>{
    const io = new Server(server,{
       cors:{
        origin:[process.env.FRONTEND_URL],
        methods:["GET","POST","PATCH","PUT","DELETE"],
        credentials: true
    }
})
   setIo(io);
  
     io.on("connection",(socket)=>{
     socketHandler(io,socket)
         
     })
     
     return io;
}
module.exports=initSocket