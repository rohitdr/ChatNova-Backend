const express = require('express')
const cors = require('cors')
const cookieParser=require('cookie-parser')
const  errorHandler = require('./Middleware/errorHandler.cjs');
const helmet = require('helmet')
const morgan = require('morgan');
const app = express()
app.set('trust proxy', 1);
app.use(cors({
    origin:process.env.FRONTEND_URL,
    credentials:true
}))
app.use(helmet())
if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
}
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth',require('./Routes/auth.cjs'))
app.use('/api/messages',require('./Routes/messages.cjs'))
app.use('/api/users',require('./Routes/users.cjs'))
app.use('/api/groups',require('./Routes/group.cjs'))
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler)

module.exports=app