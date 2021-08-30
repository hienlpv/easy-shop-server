const { Expo } = require('expo-server-sdk');

let expo = new Expo();

async function sendNotification(
    token,
    message = 'This is a test notification'
) {
    let messages = [];
    messages.push({
        to: token,
        sound: 'default',
        body: message,
        data: { withSome: 'data' },
    });
    let tickets = [];
    let chunks = expo.chunkPushNotifications(messages);
    chunks.forEach(async (chunk) => {
        try {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        } catch (error) {
            console.error(error);
        }
    });
}

module.exports = sendNotification;
