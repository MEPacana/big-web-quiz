const functions = require('firebase-functions');
const webpush = require('web-push');
const request = require('request');

exports.updateUserScore = functions.database.ref('users/{userId}/answers/{questionId}').onWrite((e) => {
    const userId = e.params.userId;
    const questionId = e.params.questionId;
    return new Promise((resolve, reject) => {
        e.data.adminRef.root.child(`questions/${questionId}/choices`).once('value', (snapshot) => {
            const choices = snapshot.val();
            const correctAnswer = choices.findIndex((choice) => choice.correct);
            e.data.adminRef.parent.parent.child('score').once('value', (snapshot) => {
                const score = snapshot.val() || 0;
                const userRef = snapshot.ref.parent;
                const scoreRef = snapshot.ref;
                e.data.adminRef.parent.parent.once('value', (snapshot) => {
                    const data = snapshot.val();
                    const profile = { name: data.name, avatar: data.avatar };
                    if (e.data.exists()) {
                        const userAnswer = parseInt(e.data.val(), 10);
                        if (userAnswer === correctAnswer) {
                            scoreRef.set(score + 1);
                            userRef.setPriority(-(score + 1));
                            profile.score = score + 1;
                            e.data.adminRef.root.child(`leaderboard/${userId}`).setWithPriority(profile, -profile.score);
                        }
                    } else if (e.data.previous.exists()) {
                        const userAnswer = parseInt(e.data.previous.val(), 10);
                        if (userAnswer === correctAnswer) {
                            scoreRef.set(score - 1);
                            userRef.setPriority(-(score - 1));
                            profile.score = score - 1;
                            e.data.adminRef.root.child(`leaderboard/${userId}`).setWithPriority(profile, -profile.score);
                        }
                    } else {
                        scoreRef.set(score);
                        userRef.setPriority(-score);
                        profile.score = score;
                        e.data.adminRef.root.child(`leaderboard/${userId}`).setWithPriority(profile, -profile.score);
                    }
                    resolve(score);
                });
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
