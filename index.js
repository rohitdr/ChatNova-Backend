const express=require('express')
const dotenv = require('dotenv')
const  cors = require("cors");
dotenv.config();
const ConnectToMongoDb = require('./db')
ConnectToMongoDb();
const app = express();
app.use(express.json())
app.use(cors())
app.use('/api/auth',require('./Routes/auth'))

const PORT = process.env.PORT || 5000
app.listen(PORT,()=>{
    console.log("listening at port 5000")
})