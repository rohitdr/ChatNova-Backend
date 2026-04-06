const express = require('express')
const cors = require('cors')
const cookieParser=require('cookie-parser')
const app = express()


app.use(cors({
    origin:process.env.FRONTEND_URL,
    credentials:true
}))
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth',require('./Routes/auth.cjs'))
app.use('/api/messages',require('./Routes/messages.cjs'))
app.use('/api/users',require('./Routes/users.cjs'))
app.use('/api/groups',require('./Routes/group.cjs'))

module.exports=app