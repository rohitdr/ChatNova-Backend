const express=require('express')
const dotenv = require('dotenv')
const  cors = require("cors");
const cookie = require('cookie-parser')
dotenv.config();
const ConnectToMongoDb = require('./db')
ConnectToMongoDb();
const app = express();
app.use(express.json())
app.use(cookie())
app.use(cors())
app.use('/api/auth',require('./Routes/auth'))
app.use('/api/messages',require('./Routes/messages'))
app.use('/api/users',require('./Routes/users'))

const PORT = process.env.PORT || 5000
app.listen(PORT,()=>{
    console.log("listening at port 5000")
})