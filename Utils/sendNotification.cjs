const admin = require('../Config/firebase.cjs')

const sendNotification = async (message, sender, user) => {

  if (!user.deviceTokens || user.deviceTokens.length === 0) {
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

    await admin.messaging().sendEachForMulticast(messagePayload)

  } catch (error) {
    console.log("FCM error:", error)
  }

}

module.exports = sendNotification