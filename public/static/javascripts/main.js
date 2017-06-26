const auth = firebase.auth();
const database = firebase.database();

auth.onAuthStateChanged((user) => {
    if (user) {
        database.ref('active-question').on('value', (snapshot) => {
            console.log(snapshot.val());
        });
    }
});


const loginBtn = document.querySelector('.login-btn');

loginBtn.addEventListener('click', (e) => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
});


function displayActiveQuestion(question) {
    if (!question) {
        return undefined;
    }
    console.log(question);
}
