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
          icon:"https://res.cloudinary.com/do2twyxai/image/upload/v1773486472/ChatGPT_Image_Mar_14_2026_04_35_32_PM_owgv9l.png"
        }
      }
    }

    await admin.messaging().sendEachForMulticast(messagePayload)
  
  } catch (error) {
    console.log("FCM error:", error.message)
  }

}

module.exports = sendNotification