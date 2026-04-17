const jwt = require('jsonwebtoken')


const socketAuthMiddleware=(socket,next)=>{
 try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }

    const decoded = jwt.verify(token, process.env.ACCESS_SECRET);

    // attach user to socket
    socket.user = decoded;

    next();
  } catch (err) {
   next(new Error("Unauthorized"));
  }
}
module.exports = socketAuthMiddleware


