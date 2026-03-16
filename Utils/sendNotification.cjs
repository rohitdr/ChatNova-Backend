const admin = require('../Config/firebase.cjs')

const sendNotification = async (message, sender, user) => {

  if (!user.deviceTokens || user.deviceTokens.length === 0) {
    console.log("return")
    return
  }

  try {

    const messagePayload = {
      tokens: user.deviceTokens,
      notification: {
        title: sender,
        body: message
      },
      webpush: {
        notification: {
          icon: "/favicon.ico"
        }
      }
    }
console.log(messagePayload)
    const res=await admin.messaging().sendEachForMulticast(messagePayload)
    console.log(res)
    console.log("dsahjk")
  } catch (error) {
    console.log("FCM error:", error.message)
  }

}

module.exports = sendNotification