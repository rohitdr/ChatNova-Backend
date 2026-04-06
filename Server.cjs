require('dotenv').config()
const http = require('http')
const app  = require('./App.cjs')
const ConnectToMongoDb = require('./Config/Db.cjs')

const initSocket=require('./socket.cjs')

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

initSocket(server)

// start server AFTER DB connects
ConnectToMongoDb()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Server running on ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB error:", err);
    process.exit(1);
  });