require('dotenv').config();

const http = require('http');
const app = require('./App.cjs');
const ConnectToMongoDb = require('./Config/Db.cjs');
const initSocket = require('./socket.cjs');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

initSocket(server);

// Server error
server.on("error", (error) => {
  console.error("Server error:", error);
});

// Port warning
if (!process.env.PORT) {
  console.warn(`PORT not defined, using default ${PORT}`);
}

let isShuttingDown = false;

// Shutdown function
const shutdown = async () => {
  if (isShuttingDown) return;

  isShuttingDown = true;
  console.log("Shutting down...");

  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log("MongoDB connection closed");
    }
  } catch (err) {
    console.error("Error closing DB:", err);
  }

  server.close(() => {
    console.log("Server Closed");
    process.exit(0);
  });

  setTimeout(() => {
    console.log("Forcefully Shutting Down....");
    process.exit(1);
  }, 5000);
};

// Handle shutdown signals
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Start server AFTER DB connects
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