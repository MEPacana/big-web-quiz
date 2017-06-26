const auth = firebase.auth();
const database = firebase.database();

auth.onAuthStateChanged((user) => {
    if (user) {
        database.ref('active-question').on('value', (snapshot) => (
            displayQuestion(snapshot.val())
        ));
    }
});


const loginBtn = document.querySelector('.login-btn');
const questionScreen = document.querySelector('.question-screen');

loginBtn.addEventListener('click', (e) => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
});


function displayQuestion(question) {
    if (!question) {
        return undefined;
    }
    displayScreen('question');
    console.log(question);
}

function displayScreen(screen) {
    const screens = Array.from(document.querySelectorAll('.screen'));
    const activeScreen = document.querySelector(`.screen.${screen}-screen`);
    screens.forEach((screen) => screen.classList.add('hidden'));
    activeScreen.classList.remove('hidden');
}
