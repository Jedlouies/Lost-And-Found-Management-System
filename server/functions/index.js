const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
admin.initializeApp();

exports.sendPushNotification = functions.database
  .ref('/notifications/{userId}/{notificationId}')
  .onCreate(async (snapshot, context) => {
    
    const notificationData = snapshot.val();
    const userId = context.params.userId;

    // Get the user's push token from their Firestore profile
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return console.log(`User document not found for ${userId}.`);
    }
    
    const pushToken = userDoc.data().expoPushToken;
    if (!pushToken) {
      return console.log(`No push token for user ${userId}.`);
    }

    // Strip HTML tags for a clean push notification body
    const bodyText = notificationData.message.replace(/<[^>]+>/g, ''); 

    const message = {
      to: pushToken,
      sound: 'default',
      title: 'New SpotSync Notification',
      body: bodyText,
      data: { route: 'UserNotificationScreen' }, // So you can navigate on tap
    };

    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Accept-encoding': 'gzip, deflate',
        },
        body: JSON.stringify(message),
      });
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
    
    return null;
  });