const admin =require('../Config/firebase.cjs')

const sendNotification =  async(message,sender,user)=>{
const payload ={
    notification:{
        title:sender,
        body:message
    }
}
if(!user.deviceTokens || user.deviceTokens.length ===0){
    return
}
try{
    const promise= await user.deviceTokens.map(token=>{
 return admin.messaging().send({
     token,
     notification:payload.notification
})
    })
    await Promise.all(promise)

}catch(error){
    console.log(error)
   
}
}


module.exports = sendNotification