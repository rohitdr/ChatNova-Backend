
const dotenv = require('dotenv')
const  cors = require("cors");
const cookie = require('cookie-parser')
const express = require('express')
const {app,server}  = require('./Socket/Socket.cjs')
dotenv.config();
const ConnectToMongoDb = require('./db.cjs')
ConnectToMongoDb();
app.use(cors({
  origin: process.env.FRONTEND_URL, // your frontend
  credentials: true,
}))
app.use(express.json())
app.use(cookie())

app.use('/api/auth',require('./Routes/auth.cjs'))
app.use('/api/messages',require('./Routes/messages.cjs'))
app.use('/api/users',require('./Routes/users.cjs'))

const PORT = process.env.PORT || 5000
server.listen(PORT,()=>{
    console.log(`listening at port ${PORT}`)
})