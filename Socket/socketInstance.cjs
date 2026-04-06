let io;
const setIo =(ioInstance)=>{
    io=ioInstance
}
const getIo =()=>{
    if(!io){
          throw new Error("Socket.io not initialized");
    }
    return io
}
module.exports={setIo,getIo}