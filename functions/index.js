const functions = require('firebase-functions');

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
