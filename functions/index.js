const functions = require('firebase-functions');
const webpush = require('web-push');
const request = require('request');

exports.updateUserScore = functions.database.ref('users/{userId}/answers/{questionId}').onWrite((e) => {
    const questionId = e.params.questionId;
    return new Promise((resolve, reject) => {
        e.data.adminRef.root.child(`questions/${questionId}/choices`).once('value', (snapshot) => {
            const choices = snapshot.val();
            const correctAnswer = choices.findIndex((choice) => choice.correct);
            const userAnswer = parseInt(e.data.val(), 10);
            e.data.adminRef.parent.parent.child('score').once('value', (snapshot) => {
                const score = snapshot.val() || 0;
                const userRef = snapshot.ref.parent;
                if (userAnswer === correctAnswer) {
                    snapshot.ref.set(score + 1);
                    userRef.setPriority(-(score + 1));
                } else if (e.data.previous.exists()) {
                    snapshot.ref.set(score - 1);
                    userRef.setPriority(-(score - 1));
                } else {
                    snapshot.ref.set(score);
                    userRef.setPriority(-score);
                }
                resolve(score);
            });
        });
    });
});

exports.notifyOnActiveQuestion = functions.database.ref('active-question').onWrite((e) => {
    if (!e.data.exists()) {
        return undefined;
    }
    return new Promise((resolve, reject) => {
        const data = e.data.val();
        const notification = {
            title: 'New Question Available',
            body: data.text
        };

        e.data.adminRef.root.child('users').once('value', (snapshot) => {
            const subscriptions = [];
            snapshot.forEach((child) => {
                const user = child.val();
                if (user.subscription) {
                    subscriptions.push(user.subscription);
                }
            });
            subscriptions.forEach((subscription) =>
                sendPushNotification(subscription, notification));
            resolve();
        });
    });
});

function sendPushNotification(subscription, notification) {
    if (subscription.keys) {
        webpush.sendNotification(subscription, JSON.stringify(notification), {
            gcmAPIKey: 'AIzaSyAbpFzMztXs5ri6JukeHPcYobauLzQBUe8',
            TTL: 3 * 60
        });
    } else {
        const subscriptionId = subscription.endpoint.split(/\//g).pop();
        const options = {
            url: 'https://android.googleapis.com/gcm/send',
            headers: {
                Authorization: 'key=AIzaSyAbpFzMztXs5ri6JukeHPcYobauLzQBUe8'
            },
            body: {
                registration_ids: subscriptionId,
                notification: notification
            },
            json: true
        };
        request.post(options);
    }
}
