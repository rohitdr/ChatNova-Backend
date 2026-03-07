const express=require('express')
const dotenv = require('dotenv')
dotenv.config();
const ConnectToMongoDb = require('./db')
ConnectToMongoDb();


const app = express();
const PORT = process.env.PORT || 5000
app.listen(PORT,()=>{
    console.log("listening at port 5000")
})